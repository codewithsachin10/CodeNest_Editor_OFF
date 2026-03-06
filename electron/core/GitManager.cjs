const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class GitManager {
    constructor() {}

    async runGitCommand(args, cwd) {
        return new Promise((resolve, reject) => {
            if (!cwd || !fs.existsSync(cwd)) {
                return resolve({ success: false, error: 'Invalid workspace path' });
            }

            const proc = spawn('git', args, { cwd, shell: false });
            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', data => { stdout += data.toString(); });
            proc.stderr.on('data', data => { stderr += data.toString(); });

            proc.on('close', code => {
                if (code === 0) {
                    resolve({ success: true, data: stdout.trim() });
                } else {
                    resolve({ success: false, error: stderr.trim() });
                }
            });
            proc.on('error', err => {
                resolve({ success: false, error: 'Git not found on system. Please install Git.' });
            });
        });
    }

    async init(workspacePath) {
        const check = await this.runGitCommand(['rev-parse', '--is-inside-work-tree'], workspacePath);
        if (check.success && check.data === 'true') {
            return { success: true, message: 'Already a git repository' };
        }
        return await this.runGitCommand(['init'], workspacePath);
    }

    async getStatus(workspacePath) {
        const res = await this.runGitCommand(['status', '--porcelain'], workspacePath);
        if (!res.success) return res;

        const files = res.data.split('\n').filter(Boolean).map(line => {
            const status = line.substring(0, 2).trim();
            const filePath = line.substring(3).trim();
            return { status, filePath };
        });
        return { success: true, files };
    }

    async commit(workspacePath, message) {
        await this.runGitCommand(['add', '.'], workspacePath);
        return await this.runGitCommand(['commit', '-m', message], workspacePath);
    }

    async getLog(workspacePath) {
        const res = await this.runGitCommand(['log', '--pretty=format:%H|%an|%ar|%s', '-n', '20'], workspacePath);
        if (!res.success) return res;

        const commits = res.data.split('\n').filter(Boolean).map(line => {
            const [hash, author, date, message] = line.split('|');
            return { hash, author, date, message };
        });
        return { success: true, commits };
    }

    async restore(workspacePath, commitHash) {
        return await this.runGitCommand(['checkout', commitHash], workspacePath);
    }
}

module.exports = new GitManager();
