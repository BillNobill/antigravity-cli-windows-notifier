# Antigravity CLI Windows Notifications

Integration hooks for Antigravity CLI providing native Windows Toast notifications for completion events, user interaction requests, and tool permission prompts.

## Overview

This project implements a professional notification system for the **Antigravity CLI** (`agy`) on Windows. It addresses the UX gap in long-running tasks by providing asynchronous alerts when the agent completes an operation or requires user intervention.

## Key Features

- **Completion & Failure Alerts**: Native Toast notifications for tasks. Automatically detects execution failures and changes alert sounds/titles accordingly.
- **Interactive Prompts**: Immediate alerts for `ask_user` tool calls and `ToolPermission` requests.
- **Native Audio**: Uses Windows native `SMS` notification sound for optimal user experience.
- **CLI Configuration**: Adjust settings like the time threshold directly from your terminal.

## Installation Guide

### Option 1: Automated via Antigravity CLI (Recommended)

1. Clone this repository and enter the directory:
   ```powershell
   git clone https://github.com/BillNobill/antigravity-cli-windows-notifier.git
   cd antigravity-cli-windows-notifier
   ```
2. Open Antigravity CLI in this folder:
   ```powershell
   agy
   ```
3. Give the following prompt:
   > "Install the windows notification hooks for me."
   *Or run the command directly:*
   ```powershell
   agy plugin install .
   ```

### Option 2: Legacy Manual Installation (Node.js)
If you prefer the legacy method (which modifies `settings.json` directly):
1. Clone the repository and navigate to the root.
2. Run the installer:
   ```powershell
   node install.js
   ```

### Uninstallation

To remove the hooks and assets from your system:
```powershell
agy plugin uninstall antigravity-windows-notifier
```
*Legacy removal:*
```powershell
node uninstall.js
```
> [!NOTE]  
> This operation will restore your `settings.json` from the latest backup and delete the notification scripts from the `.gemini/antigravity-cli/hooks` directory.

## Configuration

You can easily adjust the notification settings using the included configuration utility. By default, the system only notifies for tasks exceeding 5 seconds and the brand icon is disabled to maximize text space.

### Available Options

| Option | Description | Example |
| :--- | :--- | :--- |
| `--threshold=[seconds]` | Set minimum task duration for notifications | `node config.js --threshold=10` |
| `--icon=[on\|off]` | Enable or disable the Antigravity logo in notifications | `node config.js --icon=on` |

> [!TIP]
> You can combine options in a single command: `node config.js --threshold=5 --icon=off`

## Usage & Management

### Global Scope
Once installed, the notifier becomes **Global** for your user. It works in **any folder** where you run the Antigravity CLI.

### Enabling/Disabling Hooks
Manage notifications directly within the CLI:
- **List active hooks**: `/hooks list`
- **Disable a hook**: `/hooks disable [hook-name]`
- **Enable a hook**: `/hooks enable [hook-name]`

## Architecture

- **`BeforeAgent`**: Persists start timestamp (ms) to `%TEMP%`.
- **`AfterAgent`**: Handles duration calculation, error detection heuristics, and triggers the Windows Toast via PowerShell.
- **`BeforeTool` & `Notification`**: Intercepts `ask_user` and `ToolPermission` events while preventing duplicate notifications.

## Contributing

Technical contributions and bug reports are welcome via Pull Requests.

## License

MIT
