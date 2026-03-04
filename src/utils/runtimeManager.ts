/**
 * Runtime Manager
 * Handles downloading and setting up embedded Python runtimes.
 * Includes offline detection — download operations fail fast rather than hang.
 */

import { isOnline } from '@/utils/offlineUtils';

interface ElectronAPI {
    app: {
        getInfo: () => Promise<{ platform: string; isPackaged: boolean }>;
        getPath: (name: string) => Promise<string>;
    };
    runtime: {
        getPythonPath: () => Promise<{ path: string | null; type: 'system' | 'embedded'; version?: string }>;
        download: (url: string, targetPath: string) => Promise<{ success: boolean; error?: string }>;
        extract: (archivePath: string, targetDir: string) => Promise<{ success: boolean; error?: string }>;
        onProgress: (callback: (progress: number) => void) => () => void;
    };
    fs: {
        exists: (path: string) => Promise<boolean>;
        createFolder: (path: string) => Promise<boolean>;
        delete: (path: string) => Promise<boolean>;
        rename: (oldPath: string, newPath: string) => Promise<boolean>;
    };
}

const PYTHON_VERSION = '3.10.13';
const BUILD_TAG = '20231016';

// Python Standalone Builds (indygreg)
const PYTHON_URLS = {
    darwin: `https://github.com/indygreg/python-build-standalone/releases/download/${BUILD_TAG}/cpython-${PYTHON_VERSION}+${BUILD_TAG}-x86_64-apple-darwin-install_only.tar.gz`,
    win32: `https://github.com/indygreg/python-build-standalone/releases/download/${BUILD_TAG}/cpython-${PYTHON_VERSION}+${BUILD_TAG}-x86_64-pc-windows-msvc-shared-install_only.tar.gz`,
    linux: `https://github.com/indygreg/python-build-standalone/releases/download/${BUILD_TAG}/cpython-${PYTHON_VERSION}+${BUILD_TAG}-x86_64-unknown-linux-gnu-install_only.tar.gz`,
};

// MinGW (Windows only) - w64devkit
const MINGW_URL = 'https://github.com/skeeto/w64devkit/releases/download/v1.20.0/w64devkit-1.20.0.zip';

// JDK 21 (Eclipse Temurin)
const JDK_URLS = {
    win32: 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jdk_x64_windows_hotspot_21.0.2_13.zip',
    darwin: 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jdk_x64_mac_hotspot_21.0.2_13.tar.gz',
    linux: 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jdk_x64_linux_hotspot_21.0.2_13.tar.gz',
};

export class RuntimeManager {
    private api: ElectronAPI;

    constructor() {
        this.api = (window as any).electronAPI;
    }

    /**
     * Check if Python is installed (embedded or system)
     */
    async checkPython(): Promise<{ path: string | null; type: 'system' | 'embedded'; version?: string }> {
        if (!this.api) return { path: null, type: 'system' };
        return await this.api.runtime.getPythonPath();
    }

    /**
     * Install Embedded Python
     */
    async installPython(onProgress?: (progress: number, stage: string) => void): Promise<{ success: boolean; error?: string }> {
        if (!this.api) return { success: false, error: 'Not running in Electron' };

        // Fail fast if offline — downloading requires internet
        if (!isOnline()) {
            return { success: false, error: 'No internet connection. Python download requires an active network.' };
        }

        try {
            const { platform } = await this.api.app.getInfo();
            const url = PYTHON_URLS[platform as keyof typeof PYTHON_URLS];

            if (!url) {
                return { success: false, error: `Unsupported platform: ${platform}` };
            }

            const userDataPath = await this.api.app.getPath('userData');
            const runtimesPath = `${userDataPath}/runtimes`;
            const pythonPath = `${runtimesPath}/python`;
            const archivePath = `${userDataPath}/python_dist.tar.gz`;

            console.log('Installing Python to:', pythonPath);

            // 0. Cleanup
            if (await this.api.fs.exists(pythonPath)) {
                // Assume installed? Or re-install?
                // For now, if folder exists, we delete it to ensure fresh install
                await this.api.fs.delete(pythonPath);
            }

            // Ensure runtimes dir exists
            await this.api.fs.createFolder(runtimesPath);

            // 1. Download
            onProgress?.(0, 'downloading');

            // Setup progress listener
            const cleanupListener = this.api.runtime.onProgress((progress) => {
                onProgress?.(progress, 'downloading');
            });

            console.log('Downloading from:', url);
            const downloadResult = await this.api.runtime.download(url, archivePath);
            cleanupListener();

            if (!downloadResult.success) {
                return { success: false, error: downloadResult.error || 'Download failed' };
            }

            // 2. Extract
            onProgress?.(0, 'extracting');
            console.log('Extracting to:', pythonPath);

            const extractResult = await this.api.runtime.extract(archivePath, pythonPath);

            // Cleanup archive
            try {
                await this.api.fs.delete(archivePath);
            } catch (e) {
                console.warn('Failed to delete archive:', e);
            }

            if (!extractResult.success) {
                return { success: false, error: extractResult.error || 'Extraction failed' };
            }

            onProgress?.(100, 'completed');
            return { success: true };

        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Install Embedded C/C++ (MinGW on Windows)
     */
    async installC(onProgress?: (progress: number, stage: string) => void): Promise<{ success: boolean; error?: string }> {
        if (!this.api) return { success: false, error: 'Not running in Electron' };
        if (!isOnline()) return { success: false, error: 'No internet connection' };

        try {
            const { platform } = await this.api.app.getInfo();
            if (platform !== 'win32') {
                return { success: true }; // Assuming pre-installed on Mac/Linux or not bundling
            }

            const userDataPath = await this.api.app.getPath('userData');
            const runtimesPath = `${userDataPath}/runtimes`;
            const mingwPath = `${runtimesPath}/mingw`;
            const archivePath = `${userDataPath}/mingw.zip`;

            if (await this.api.fs.exists(mingwPath)) await this.api.fs.delete(mingwPath);
            await this.api.fs.createFolder(runtimesPath);

            onProgress?.(0, 'downloading');
            const cleanupListener = this.api.runtime.onProgress((p) => onProgress?.(p, 'downloading'));
            const downloadResult = await this.api.runtime.download(MINGW_URL, archivePath);
            cleanupListener();

            if (!downloadResult.success) return { success: false, error: downloadResult.error || 'Download failed' };

            onProgress?.(0, 'extracting');
            const extractResult = await this.api.runtime.extract(archivePath, mingwPath);

            try { await this.api.fs.delete(archivePath); } catch (e) {}
            if (!extractResult.success) return { success: false, error: extractResult.error || 'Extraction failed' };

            onProgress?.(100, 'completed');
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Install Embedded Java JDK
     */
    async installJava(onProgress?: (progress: number, stage: string) => void): Promise<{ success: boolean; error?: string }> {
        if (!this.api) return { success: false, error: 'Not running in Electron' };
        if (!isOnline()) return { success: false, error: 'No internet connection' };

        try {
            const { platform } = await this.api.app.getInfo();
            const url = JDK_URLS[platform as keyof typeof JDK_URLS];
            if (!url) return { success: false, error: `Unsupported platform: ${platform}` };

            const userDataPath = await this.api.app.getPath('userData');
            const runtimesPath = `${userDataPath}/runtimes`;
            const jdkPath = `${runtimesPath}/jdk`;
            const extension = url.endsWith('.zip') ? '.zip' : '.tar.gz';
            const archivePath = `${userDataPath}/jdk${extension}`;

            if (await this.api.fs.exists(jdkPath)) await this.api.fs.delete(jdkPath);
            await this.api.fs.createFolder(runtimesPath);

            onProgress?.(0, 'downloading');
            const cleanupListener = this.api.runtime.onProgress((p) => onProgress?.(p, 'downloading'));
            const downloadResult = await this.api.runtime.download(url, archivePath);
            cleanupListener();

            if (!downloadResult.success) return { success: false, error: downloadResult.error || 'Download failed' };

            onProgress?.(0, 'extracting');
            const tmpExtractPath = `${runtimesPath}/jdk_tmp`;
            await this.api.fs.createFolder(tmpExtractPath);
            const extractResult = await this.api.runtime.extract(archivePath, tmpExtractPath);

            try { await this.api.fs.delete(archivePath); } catch (e) {}
            if (!extractResult.success) return { success: false, error: extractResult.error || 'Extraction failed' };

            // Find the inner JDK folder and rename
            const dirContents = await (window as any).electronAPI.fs.readDir(tmpExtractPath);
            const innerDir = dirContents.find((entry: any) => entry.isDirectory);
            if (innerDir) {
                await this.api.fs.rename(`${tmpExtractPath}/${innerDir.name}`, jdkPath);
            } else {
                await this.api.fs.rename(tmpExtractPath, jdkPath);
            }
            await this.api.fs.delete(tmpExtractPath);

            onProgress?.(100, 'completed');
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
}

export const runtimeManager = new RuntimeManager();
