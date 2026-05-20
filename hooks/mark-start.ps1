# mark-start.ps1
# Registra o timestamp de início de um prompt do Antigravity CLI
# Salva em um arquivo temporário vinculado ao session_id

$inputRaw = $input | Out-String
if ($inputRaw) {
    try {
        $inputJson = $inputRaw | ConvertFrom-Json
        $sessionId = $inputJson.session_id
        if ($sessionId) {
            $tempFile = Join-Path $env:TEMP "antigravity-start-$sessionId.txt"
            # Pega o Unix Timestamp em milissegundos (inteiro, evita erro de vírgula/ponto)
            $ms = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            [System.IO.File]::WriteAllText($tempFile, $ms.ToString())
        }
    } catch {
        # Falha silenciosa para não interromper o CLI
    }
}
