/**
 * Automated Uninstaller for Antigravity CLI Windows Notifier
 * Removes hooks from settings.json and deletes associated files.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const GEMINI_DIR = path.join(os.homedir(), '.gemini', 'antigravity-cli');
const HOOKS_DIR = path.join(GEMINI_DIR, 'hooks');
const ASSETS_DIR = path.join(GEMINI_DIR, 'assets');
const SETTINGS_PATH = path.join(GEMINI_DIR, 'settings.json');
const BACKUP_PATH = SETTINGS_PATH + '.bak';

const FILES_TO_REMOVE = [
    'mark-start.ps1',
    'mark-start.js',
    'windows-notify.js',
    'windows-ask-notify.js'
];

const ASSETS_TO_REMOVE = [
    'antigravity-logo.png'
];

function log(msg) { console.log(`[UNINSTALLER] ${msg}`); }
function error(msg) { console.error(`[ERROR] ${msg}`); process.exit(1); }

async function teardown() {
    log('Starting Antigravity CLI Windows Notifier removal...');

    if (!fs.existsSync(SETTINGS_PATH)) {
        error('settings.json not found. Nothing to uninstall.');
    }

    // 1. Backup settings
    log(`Creating backup at ${BACKUP_PATH}...`);
    fs.copyFileSync(SETTINGS_PATH, BACKUP_PATH);

    // 2. Remove hooks from settings.json
    let settings;
    try {
        settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    } catch (e) {
        error(`Failed to parse settings.json: ${e.message}`);
    }

    if (settings.hooks) {
        log('Removing hooks from settings.json...');
        const hookNamesToRemove = ['start-timer', 'windows-notifier', 'ask-notifier', 'permission-notifier'];
        
        for (const event in settings.hooks) {
            settings.hooks[event] = settings.hooks[event].filter(entry => {
                const hasHookToRemove = entry.hooks && entry.hooks.some(h => hookNamesToRemove.includes(h.name));
                return !hasHookToRemove;
            });

            // Clean up empty events
            if (settings.hooks[event].length === 0) {
                delete settings.hooks[event];
            }
        }

        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
        log('settings.json updated.');
    }

    // 3. Remove files
    log('Deleting notification scripts...');
    for (const file of FILES_TO_REMOVE) {
        const p = path.join(HOOKS_DIR, file);
        if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    log('Deleting notification assets...');
    for (const file of ASSETS_TO_REMOVE) {
        const p = path.join(ASSETS_DIR, file);
        if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    log('Uninstallation complete. Settings backup kept as settings.json.bak.');
}

teardown().catch(err => error(err.message));
