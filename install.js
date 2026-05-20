/**
 * Automated Installer for Antigravity CLI Windows Notifier
 * Detects .gemini directory, copies hooks, and updates settings.json.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const GEMINI_DIR = path.join(os.homedir(), '.gemini', 'antigravity-cli');
const HOOKS_DIR = path.join(GEMINI_DIR, 'hooks');
const ASSETS_DIR = path.join(GEMINI_DIR, 'assets');
const SETTINGS_PATH = path.join(GEMINI_DIR, 'settings.json');

const SCRIPTS_TO_COPY = [
    'mark-start.ps1',
    'mark-start.js',
    'windows-notify.js',
    'windows-ask-notify.js'
];

function log(msg) { console.log(`[INSTALLER] ${msg}`); }
function error(msg) { console.error(`[ERROR] ${msg}`); process.exit(1); }

async function setup() {
    log('Starting Antigravity CLI Windows Notifier installation...');

    // 1. Verify .gemini directory
    if (!fs.existsSync(GEMINI_DIR)) {
        error('.gemini directory not found in user home. Is Antigravity CLI/Gemini CLI installed?');
    }

    // 2. Create directories if missing
    if (!fs.existsSync(HOOKS_DIR)) {
        log('Creating hooks directory...');
        fs.mkdirSync(HOOKS_DIR, { recursive: true });
    }
    if (!fs.existsSync(ASSETS_DIR)) {
        log('Creating assets directory...');
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    // 3. Copy scripts
    log('Copying notification scripts...');
    for (const file of SCRIPTS_TO_COPY) {
        const src = path.join(__dirname, 'hooks', file);
        const dest = path.join(HOOKS_DIR, file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
        } else {
            log(`Warning: ${file} not found in current directory. Skipping.`);
        }
    }

    // 3.1 Copy assets
    log('Copying notification assets...');
    const srcAssetsDir = path.join(__dirname, 'assets');
    if (fs.existsSync(srcAssetsDir)) {
        const assetFiles = fs.readdirSync(srcAssetsDir);
        for (const file of assetFiles) {
            fs.copyFileSync(path.join(srcAssetsDir, file), path.join(ASSETS_DIR, file));
        }
    }

    // 4. Update settings.json
    if (!fs.existsSync(SETTINGS_PATH)) {
        log('settings.json not found. Creating a new one...');
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify({ hooks: {} }, null, 2));
    }

    let settings;
    try {
        settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    } catch (e) {
        error(`Failed to parse settings.json: ${e.message}`);
    }

    if (!settings.hooks) settings.hooks = {};

    // Helper to add or update a hook
    const updateHook = (event, name, type, command, timeout = 5000) => {
        if (!settings.hooks[event]) settings.hooks[event] = [];
        
        let hookGroup = settings.hooks[event].find(g => {
            const h = g.hooks && g.hooks[0];
            return h && (h.name === name || h.command.includes(name));
        });

        const newHookData = { name, type, command, timeout };
        
        // Add specific matchers for some events
        let matcher = '.*';
        if (event === 'BeforeTool' && name === 'ask-notifier') {
            matcher = 'ask_user';
        } else if (event === 'Notification') {
            matcher = undefined; // Notification event doesn't use matcher
        }

        if (!hookGroup) {
            log(`Adding ${name} hook to ${event}...`);
            const entry = { hooks: [newHookData] };
            if (matcher) entry.matcher = matcher;
            settings.hooks[event].push(entry);
            return true;
        } else {
            const existingHook = hookGroup.hooks[0];
            if (existingHook.command !== command || existingHook.timeout !== timeout) {
                log(`Updating existing ${name} hook in ${event}...`);
                hookGroup.hooks[0] = newHookData;
                if (matcher && !hookGroup.matcher) hookGroup.matcher = matcher;
                return true;
            }
        }
        return false;
    };

    const homeSub = os.homedir().replace(/\\/g, '/');
    const updated = [
        updateHook('BeforeAgent', 'start-timer', 'command', `node "${homeSub}/.gemini/antigravity-cli/hooks/mark-start.js"`),
        updateHook('AfterAgent', 'windows-notifier', 'command', `node "${homeSub}/.gemini/antigravity-cli/hooks/windows-notify.js"`),
        updateHook('BeforeTool', 'ask-notifier', 'command', `node "${homeSub}/.gemini/antigravity-cli/hooks/windows-ask-notify.js"`),
        updateHook('Notification', 'permission-notifier', 'command', `node "${homeSub}/.gemini/antigravity-cli/hooks/windows-ask-notify.js"`)
    ].some(v => v);

    if (updated) {
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
        log('settings.json updated successfully.');
    } else {
        log('No changes needed in settings.json (hooks already present).');
    }

    log('Installation complete! Enjoy your notifications.');
}

setup().catch(err => error(err.message));
