/**
 * Configuration Utility for Antigravity CLI Windows Notifier
 * Safely updates the notification threshold in settings.json
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SETTINGS_PATH = path.join(os.homedir(), '.gemini', 'antigravity-cli', 'settings.json');
const BACKUP_PATH = SETTINGS_PATH + '.bak';

function log(msg) { console.log(`[CONFIG] ${msg}`); }
function error(msg) { console.error(`[ERROR] ${msg}`); process.exit(1); }

const args = process.argv.slice(2);
const thresholdArg = args.find(a => a.startsWith('--threshold='));
const iconArg = args.find(a => a.startsWith('--icon='));

if (!thresholdArg && !iconArg) {
    console.log('Usage: node config.js [options]');
    console.log('Options:');
    console.log('  --threshold=[seconds]  Set minimum duration for notifications');
    console.log('  --icon=[on|off]        Enable or disable notification icon');
    console.log('\nExample: node config.js --threshold=10 --icon=on');
    process.exit(0);
}

async function updateConfig() {
    if (!fs.existsSync(SETTINGS_PATH)) {
        error('settings.json not found. Please run the installer first.');
    }

    log(`Creating backup at ${BACKUP_PATH}...`);
    fs.copyFileSync(SETTINGS_PATH, BACKUP_PATH);

    const hooksDir = path.join(os.homedir(), '.gemini', 'antigravity-cli', 'hooks');
    const scripts = ['windows-notify.js', 'windows-ask-notify.js'];
    let anyUpdated = false;

    for (const scriptName of scripts) {
        const scriptPath = path.join(hooksDir, scriptName);
        if (!fs.existsSync(scriptPath)) continue;

        let content = fs.readFileSync(scriptPath, 'utf8');
        let newContent = content;

        if (thresholdArg && scriptName === 'windows-notify.js') {
            const newThreshold = parseInt(thresholdArg.split('=')[1]);
            if (!isNaN(newThreshold)) {
                log(`Updating threshold to ${newThreshold}s in ${scriptName}...`);
                newContent = newContent.replace(/const THRESHOLD_SECONDS = \d+;/, `const THRESHOLD_SECONDS = ${newThreshold};`);
            }
        }

        if (iconArg) {
            const val = iconArg.split('=')[1] === 'on' ? 'true' : 'false';
            log(`Setting icon to ${val} in ${scriptName}...`);
            newContent = newContent.replace(/const SHOW_ICON = (true|false);/, `const SHOW_ICON = ${val};`);
        }

        if (content !== newContent) {
            fs.writeFileSync(scriptPath, newContent);
            anyUpdated = true;
        }
    }

    if (anyUpdated) {
        log('Configuration updated successfully!');
    } else {
        log('No changes were made.');
    }
}

updateConfig().catch(err => error(err.message));
