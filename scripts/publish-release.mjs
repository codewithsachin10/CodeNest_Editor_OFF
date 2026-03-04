#!/usr/bin/env node
/**
 * publish-release.mjs — Upload installers to Supabase Storage + create release records
 *
 * Usage:
 *   node scripts/publish-release.mjs                     # uploads all platforms found in dist-installers/
 *   node scripts/publish-release.mjs --platform mac      # upload only macOS
 *   node scripts/publish-release.mjs --dry-run           # show what would be uploaded
 *
 * Required env vars (set in .env or export):
 *   SUPABASE_URL          — your Supabase project URL (e.g. https://xyz.supabase.co)
 *   SUPABASE_SERVICE_KEY  — service_role key (NOT the anon key — needs write access to storage & tables)
 *
 * Optional env vars:
 *   STORAGE_BUCKET        — bucket name (default: "releases")
 *   RELEASE_NOTES         — release notes text
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Config ────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = process.env.STORAGE_BUCKET || 'releases';
const RELEASE_NOTES = process.env.RELEASE_NOTES || '';

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const VERSION = pkg.version;
const OUTPUT_DIR = path.join(ROOT, 'dist-installers');

// ─── CLI flags ─────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const platformFilter = args.includes('--platform')
    ? args[args.indexOf('--platform') + 1]
    : null;

// ─── Artifact mapping ──────────────────────────────────────────────
// Maps filename patterns → platform + file_type

const ARTIFACT_PATTERNS = [
    { pattern: /-mac\.dmg$/i,            platform: 'macos',   fileType: '.dmg',      label: 'macOS DMG' },
    { pattern: /-mac\.zip$/i,            platform: 'macos',   fileType: '.zip',      label: 'macOS ZIP' },
    { pattern: /-win\.exe$/i,            platform: 'windows', fileType: '.exe',      label: 'Windows Installer' },
    { pattern: /Setup.*\.exe$/i,         platform: 'windows', fileType: '.exe',      label: 'Windows Installer' },
    { pattern: /-linux\.AppImage$/i,     platform: 'linux',   fileType: '.AppImage', label: 'Linux AppImage' },
    { pattern: /-linux\.deb$/i,          platform: 'linux',   fileType: '.deb',      label: 'Linux Deb' },
    { pattern: /\.dmg$/i,               platform: 'macos',   fileType: '.dmg',      label: 'macOS DMG' },
    { pattern: /\.exe$/i,               platform: 'windows', fileType: '.exe',      label: 'Windows Installer' },
    { pattern: /\.AppImage$/i,          platform: 'linux',   fileType: '.AppImage', label: 'Linux AppImage' },
    { pattern: /\.deb$/i,               platform: 'linux',   fileType: '.deb',      label: 'Linux Deb' },
];

// ─── Helpers ───────────────────────────────────────────────────────

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function findArtifacts() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        console.error(`❌ Output directory not found: ${OUTPUT_DIR}`);
        console.error('   Run "npm run electron:build" first.');
        process.exit(1);
    }

    // Search in OUTPUT_DIR and one level of subdirectories (e.g., dist-installers/mac/)
    const allFiles = [];
    const entries = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isFile()) {
            allFiles.push(path.join(OUTPUT_DIR, entry.name));
        } else if (entry.isDirectory()) {
            const subEntries = fs.readdirSync(path.join(OUTPUT_DIR, entry.name));
            for (const subFile of subEntries) {
                allFiles.push(path.join(OUTPUT_DIR, entry.name, subFile));
            }
        }
    }

    const artifacts = [];
    for (const filePath of allFiles) {
        const fileName = path.basename(filePath);
        const match = ARTIFACT_PATTERNS.find(p => p.pattern.test(fileName));
        if (match) {
            const stat = fs.statSync(filePath);
            artifacts.push({
                filePath,
                fileName,
                platform: match.platform,
                fileType: match.fileType,
                label: match.label,
                size: stat.size,
                sizeFormatted: formatSize(stat.size),
            });
        }
    }

    // Filter by platform flag
    if (platformFilter) {
        const normalized = platformFilter.toLowerCase();
        const platformMap = { mac: 'macos', macos: 'macos', win: 'windows', windows: 'windows', linux: 'linux' };
        const target = platformMap[normalized] || normalized;
        return artifacts.filter(a => a.platform === target);
    }

    // Prefer primary artifact per platform (DMG over ZIP, AppImage over DEB)
    const priority = { '.dmg': 1, '.exe': 1, '.AppImage': 1, '.deb': 2, '.zip': 3 };
    const byPlatform = new Map();
    for (const art of artifacts) {
        const existing = byPlatform.get(art.platform);
        if (!existing || (priority[art.fileType] || 99) < (priority[existing.fileType] || 99)) {
            byPlatform.set(art.platform, art);
        }
    }

    return Array.from(byPlatform.values());
}

async function uploadToStorage(artifact) {
    const storagePath = `v${VERSION}/${artifact.fileName}`;
    const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;

    const fileBuffer = fs.readFileSync(artifact.filePath);

    // Determine content type
    const contentTypes = {
        '.dmg': 'application/x-apple-diskimage',
        '.exe': 'application/x-msdownload',
        '.AppImage': 'application/x-executable',
        '.deb': 'application/vnd.debian.binary-package',
        '.zip': 'application/zip',
    };
    const contentType = contentTypes[artifact.fileType] || 'application/octet-stream';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': contentType,
            'x-upsert': 'true', // overwrite if exists
        },
        body: fileBuffer,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Storage upload failed (${response.status}): ${errorText}`);
    }

    // Return the public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
    return publicUrl;
}

async function createReleaseRecord(artifact, downloadUrl) {
    const url = `${SUPABASE_URL}/rest/v1/releases`;

    // First check if a release for this platform+version already exists
    const checkUrl = `${url}?platform=eq.${artifact.platform}&version=eq.${VERSION}&select=id`;
    const checkResponse = await fetch(checkUrl, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
    });
    const existing = await checkResponse.json();

    const body = {
        platform: artifact.platform,
        version: VERSION,
        download_url: downloadUrl,
        file_type: artifact.fileType,
        file_size: artifact.sizeFormatted,
        is_available: true,
        release_notes: RELEASE_NOTES || `CodeNest Studio v${VERSION}`,
    };

    if (existing && existing.length > 0) {
        // Update existing record
        const updateUrl = `${url}?id=eq.${existing[0].id}`;
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Update release record failed (${response.status}): ${errText}`);
        }
        return { action: 'updated', data: await response.json() };
    } else {
        // Create new record
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Create release record failed (${response.status}): ${errText}`);
        }
        return { action: 'created', data: await response.json() };
    }
}

async function generateLatestJson(artifacts, downloadUrls) {
    // Also upload a latest.json for the auto-updater (electron-updater)
    const latest = {
        version: VERSION,
        releaseDate: new Date().toISOString(),
        releaseNotes: RELEASE_NOTES || `CodeNest Studio v${VERSION}`,
        files: artifacts.map((art, i) => ({
            name: art.fileName,
            url: downloadUrls[i],
            size: art.size,
            platform: art.platform,
        })),
    };

    const storagePath = `latest.json`;
    const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'x-upsert': 'true',
        },
        body: JSON.stringify(latest, null, 2),
    });

    if (!response.ok) {
        console.warn(`⚠️  Failed to upload latest.json: ${response.status}`);
    } else {
        console.log(`✅ latest.json uploaded`);
    }

    // Also upload platform-specific latest-*.yml for electron-updater
    for (let i = 0; i < artifacts.length; i++) {
        const art = artifacts[i];
        let ymlName;
        if (art.platform === 'macos') ymlName = 'latest-mac.yml';
        else if (art.platform === 'windows') ymlName = 'latest.yml';
        else if (art.platform === 'linux') ymlName = 'latest-linux.yml';
        else continue;

        const yml = [
            `version: ${VERSION}`,
            `files:`,
            `  - url: ${art.fileName}`,
            `    size: ${art.size}`,
            `releaseDate: '${new Date().toISOString()}'`,
        ].join('\n');

        const ymlUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${ymlName}`;
        const ymlResp = await fetch(ymlUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'text/yaml',
                'x-upsert': 'true',
            },
            body: yml,
        });

        if (ymlResp.ok) {
            console.log(`✅ ${ymlName} uploaded`);
        } else {
            console.warn(`⚠️  Failed to upload ${ymlName}: ${ymlResp.status}`);
        }
    }
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║      CodeNest Studio — Release Publisher        ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');

    // Validate env
    if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_KEY)) {
        console.error('❌ Missing environment variables:');
        if (!SUPABASE_URL) console.error('   SUPABASE_URL is not set');
        if (!SUPABASE_KEY) console.error('   SUPABASE_SERVICE_KEY is not set');
        console.error('');
        console.error('Set them in your shell or create a .env file:');
        console.error('   export SUPABASE_URL=https://your-project.supabase.co');
        console.error('   export SUPABASE_SERVICE_KEY=your-service-role-key');
        process.exit(1);
    }

    // Find artifacts
    const artifacts = findArtifacts();

    if (artifacts.length === 0) {
        console.error('❌ No installer artifacts found in dist-installers/');
        console.error('   Run "npm run electron:build" first.');
        process.exit(1);
    }

    console.log(`📦 Version: ${VERSION}`);
    console.log(`📁 Found ${artifacts.length} artifact(s):`);
    console.log('');

    for (const art of artifacts) {
        console.log(`   ${art.label}`);
        console.log(`   ├─ File: ${art.fileName}`);
        console.log(`   ├─ Size: ${art.sizeFormatted}`);
        console.log(`   └─ Platform: ${art.platform}`);
        console.log('');
    }

    if (DRY_RUN) {
        console.log('🔍 Dry run — no uploads performed.');
        console.log('');
        console.log('Would upload to:');
        for (const art of artifacts) {
            console.log(`   ${SUPABASE_URL || '<SUPABASE_URL>'}/storage/v1/object/public/${BUCKET}/v${VERSION}/${art.fileName}`);
        }
        process.exit(0);
    }

    // Upload & create records
    const downloadUrls = [];

    for (const art of artifacts) {
        try {
            // 1. Upload binary to Supabase Storage
            process.stdout.write(`⬆️  Uploading ${art.fileName} (${art.sizeFormatted})...`);
            const downloadUrl = await uploadToStorage(art);
            console.log(' ✅');
            downloadUrls.push(downloadUrl);

            // 2. Create/update release record in database
            process.stdout.write(`📝 Creating release record for ${art.platform}...`);
            const result = await createReleaseRecord(art, downloadUrl);
            console.log(` ✅ (${result.action})`);

        } catch (err) {
            console.log(' ❌');
            console.error(`   Error: ${err.message}`);
            process.exit(1);
        }
    }

    // 3. Upload latest.json + YAML files for auto-updater
    console.log('');
    await generateLatestJson(artifacts, downloadUrls);

    // Summary
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Release published successfully!');
    console.log('');
    console.log('Download URLs:');
    for (let i = 0; i < artifacts.length; i++) {
        console.log(`   ${artifacts[i].platform}: ${downloadUrls[i]}`);
    }
    console.log('');
    console.log('Your website download page will now show v' + VERSION);
    console.log('═══════════════════════════════════════════════════');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
