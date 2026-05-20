#!/usr/bin/env node
const { execFile } = require('child_process');

/**
 * Hook de Alerta para Windows (Perguntas e Permissões)
 */

const SHOW_ICON = false;

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
    try {
        if (!input.trim()) {
            process.stdout.write(JSON.stringify({ decision: "allow" }));
            return;
        }

        const data = JSON.parse(input);
        const toolName = data.tool_name;
        const notificationType = data.notification_type; 
        
        let notificationTitle = "";
        let notificationText = "";

        // Se for o pedido de permissão genérico para o ask_user, ignora (para não duplicar)
        if (notificationType === 'ToolPermission' && toolName === 'ask_user') {
            process.stdout.write(JSON.stringify({ decision: "allow" }));
            return;
        }

        const path = require('path');
        const os = require('os');
        const logoPath = path.join(os.homedir(), '.gemini', 'antigravity-cli', 'assets', 'antigravity-logo.png');

        // Pergunta direta ao usuário (ask_user)
        if (toolName === 'ask_user' && data.tool_input && data.tool_input.questions) {
            const firstQuestion = data.tool_input.questions[0].question;
            if (firstQuestion) {
                notificationTitle = "Antigravity: Question";
                notificationText = firstQuestion.trim()
                    .replace(/\s\s+/g, ' ') // Normaliza espaços
                    .substring(0, 120);
            }
        } 
        // Pedido de permissão para outras ferramentas
        else if (notificationType === 'ToolPermission') {
            notificationTitle = "Antigravity: Permission";
            notificationText = `Do you want to execute ${toolName || 'tool'}?`;
        }
        else {
            process.stdout.write(JSON.stringify({ decision: "allow" }));
            return;
        }

        const iconTag = SHOW_ICON ? `<image placement="appLogoOverride" src="file:///${logoPath.replace(/\\/g, '/')}" />` : '';

        const psScript = `
            [void][Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
            [void][Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]
            $title = "${notificationTitle.replace(/"/g, '`"')}"
            $text = "${notificationText.replace(/"/g, '`"')}"
            $template = @"
<toast duration="long">
    <visual>
        <binding template="ToastGeneric">
            ${iconTag}
            <text>$title</text>
            <text>$text</text>
        </binding>
    </visual>
    <audio src="ms-winsoundevent:Notification.SMS" />
</toast>
"@
            $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
            $xml.LoadXml($template)
            $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
            # AppId oficial do PowerShell
            $appId = "{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe"
            [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)
        `;

        execFile('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], () => {
            process.stdout.write(JSON.stringify({ decision: "allow" }));
        });

    } catch (e) {
        process.stdout.write(JSON.stringify({ decision: "allow" }));
    }
});
