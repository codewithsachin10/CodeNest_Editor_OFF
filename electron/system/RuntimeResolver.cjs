/**
 * CodeNest Studio — Runtime Resolver
 *
 * Resolves the correct compiler/interpreter path for each language.
 * Priority order:
 *   1. User settings override (settings.languages.python.interpreterPath)
 *   2. Bundled portable runtime (resources/runtime/python/)
 *   3. System PATH (which, where)
 *
 * Never relies fully on system PATH.
 * Returns null if no runtime is found — caller must handle gracefully.
 */

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const Logger = require('../core/Logger.cjs');
const { getExtension, getOutputBinaryPath, getJavaClassName, getDirectory } = require('./PathUtils.cjs');

/**
 * Resolve the run configuration for a file.
 *
 * @param {string} filePath — Absolute path to the source file
 * @param {string} language — Language identifier ('python', 'c', 'cpp', 'java', 'javascript')
 * @param {object} langSettings — The settings.languages object from SettingsContext
 * @param {string} platform — process.platform ('win32', 'darwin', 'linux')
 * @param {string} [bundledRuntimesPath] — Path to resources/runtime/ (optional)
 * @returns {{ cmd: string, args: string[], compileCmd?: string, compileArgs?: string[], outputPath?: string } | null}
 */
function resolveRunConfig(filePath, language, langSettings, platform, bundledRuntimesPath) {
    Logger.execution('runtime:resolve', { language, platform, filePath });

    switch (language) {
        case 'python':
            return resolvePython(filePath, langSettings?.python, platform, bundledRuntimesPath);
        case 'javascript':
            return resolveJavaScript(filePath, langSettings?.javascript, platform, bundledRuntimesPath);
        case 'c':
            return resolveC(filePath, langSettings?.c, platform, bundledRuntimesPath);
        case 'cpp':
            return resolveCpp(filePath, langSettings?.cpp, platform, bundledRuntimesPath);
        case 'java':
            return resolveJava(filePath, langSettings?.java, platform, bundledRuntimesPath);
        default:
            Logger.warn('RuntimeResolver: Unsupported language', { language });
            return null;
    }
}

// ─── Python ──────────────────────────────────────────────────────────────────

function resolvePython(filePath, settings, platform, bundledPath) {
    let cmd;

    // 1. Settings override
    if (settings?.interpreterPath && settings.interpreterPath !== 'auto') {
        cmd = settings.interpreterPath;
    }
    // 2. Bundled runtime
    else if (bundledPath) {
        const bundledPy = path.join(bundledPath, 'python',
            platform === 'win32' ? 'python.exe' : 'bin/python3');
        if (fs.existsSync(bundledPy)) {
            cmd = bundledPy;
        }
    }

    // 3. System PATH
    if (!cmd) {
        cmd = platform === 'win32' ? 'python' : 'python3';
    }

    const args = [];
    if (settings?.unbuffered !== false) args.push('-u');
    args.push(filePath);

    Logger.execution('runtime:resolved', { language: 'python', cmd, source: cmd.includes(path.sep) ? 'bundled' : 'system' });
    return { cmd, args };
}

// ─── JavaScript (Node.js) ────────────────────────────────────────────────────

function resolveJavaScript(filePath, settings, platform, bundledPath) {
    let cmd;

    if (settings?.nodePath && settings.nodePath !== 'auto') {
        cmd = settings.nodePath;
    } else {
        cmd = 'node';
    }

    return { cmd, args: [filePath] };
}

// ─── C ───────────────────────────────────────────────────────────────────────

function resolveC(filePath, settings, platform, bundledPath) {
    let compiler;

    // 1. Settings
    if (settings?.compilerPath && settings.compilerPath !== 'auto') {
        compiler = settings.compilerPath;
    }
    // 2. Bundled MinGW (Windows)
    else if (bundledPath && platform === 'win32') {
        const bundledGcc = path.join(bundledPath, 'mingw', 'bin', 'gcc.exe');
        if (fs.existsSync(bundledGcc)) {
            compiler = bundledGcc;
        }
    }
    // 3. System
    if (!compiler) {
        compiler = 'gcc';
    }

    const outputPath = getOutputBinaryPath(filePath, platform);
    const compileArgs = [];

    // Standard flag
    const std = settings?.standard || 'c11';
    compileArgs.push(`-std=${std}`);

    // Warning flags
    if (settings?.wallEnabled !== false) compileArgs.push('-Wall');
    if (settings?.wextraEnabled) compileArgs.push('-Wextra');

    // Input and output
    compileArgs.push(filePath, '-o', outputPath);

    return {
        compileCmd: compiler,
        compileArgs,
        cmd: outputPath,
        args: [],
        outputPath,
    };
}

// ─── C++ ─────────────────────────────────────────────────────────────────────

function resolveCpp(filePath, settings, platform, bundledPath) {
    let compiler;

    if (settings?.compilerPath && settings.compilerPath !== 'auto') {
        compiler = settings.compilerPath;
    } else if (bundledPath && platform === 'win32') {
        const bundledGpp = path.join(bundledPath, 'mingw', 'bin', 'g++.exe');
        if (fs.existsSync(bundledGpp)) {
            compiler = bundledGpp;
        }
    }
    if (!compiler) {
        compiler = 'g++';
    }

    const outputPath = getOutputBinaryPath(filePath, platform);
    const compileArgs = [];

    const std = settings?.standard || 'c++17';
    compileArgs.push(`-std=${std}`);
    if (settings?.wallEnabled !== false) compileArgs.push('-Wall');
    if (settings?.wextraEnabled) compileArgs.push('-Wextra');
    compileArgs.push(filePath, '-o', outputPath);

    return {
        compileCmd: compiler,
        compileArgs,
        cmd: outputPath,
        args: [],
        outputPath,
    };
}

// ─── Java ────────────────────────────────────────────────────────────────────

function resolveJava(filePath, settings, platform, bundledPath) {
    let javacCmd = 'javac';
    let javaCmd = 'java';

    if (settings?.jdkPath && settings.jdkPath !== 'auto') {
        const binDir = path.join(settings.jdkPath, 'bin');
        javacCmd = path.join(binDir, platform === 'win32' ? 'javac.exe' : 'javac');
        javaCmd = path.join(binDir, platform === 'win32' ? 'java.exe' : 'java');
    } else if (bundledPath) {
        const bundledJavac = path.join(bundledPath, 'jdk', 'bin',
            platform === 'win32' ? 'javac.exe' : 'javac');
        if (fs.existsSync(bundledJavac)) {
            javacCmd = bundledJavac;
            javaCmd = path.join(bundledPath, 'jdk', 'bin',
                platform === 'win32' ? 'java.exe' : 'java');
        }
    }

    const className = getJavaClassName(filePath);
    const classDir = getDirectory(filePath);

    const compileArgs = [filePath];
    if (settings?.enablePreviewFeatures) {
        compileArgs.unshift('--enable-preview', '--source', '21');
    }

    const runArgs = ['-cp', classDir, className];
    if (settings?.enablePreviewFeatures) {
        runArgs.unshift('--enable-preview');
    }

    return {
        compileCmd: javacCmd,
        compileArgs,
        cmd: javaCmd,
        args: runArgs,
    };
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Check if a command exists on the system.
 *
 * @param {string} cmd
 * @returns {Promise<boolean>}
 */
function commandExists(cmd) {
    return new Promise((resolve) => {
        const check = process.platform === 'win32'
            ? `where ${cmd}`
            : `which ${cmd}`;
        exec(check, { timeout: 2000 }, (err) => {
            resolve(!err);
        });
    });
}

module.exports = { resolveRunConfig, commandExists };
