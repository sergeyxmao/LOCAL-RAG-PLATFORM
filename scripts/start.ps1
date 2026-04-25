function Test-OllamaReady {
    try {
        $null = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 5
        return $true
    } catch {
        return $false
    }
}

function Start-OllamaIfNeeded {
    if (Test-OllamaReady) {
        Write-Host "Ollama уже запущен." -ForegroundColor DarkGreen
        return
    }

    $ollamaExe = Join-Path $env:LOCALAPPDATA "Programs\\Ollama\\ollama.exe"
    if (!(Test-Path $ollamaExe)) {
        Write-Warning "Ollama не найден по пути $ollamaExe"
        return
    }

    Write-Host "Ollama не отвечает. Запускаю ollama serve..." -ForegroundColor Yellow
    Start-Process $ollamaExe -ArgumentList "serve" -WindowStyle Hidden

    for ($attempt = 1; $attempt -le 10; $attempt++) {
        Start-Sleep -Seconds 2
        if (Test-OllamaReady) {
            Write-Host "Ollama успешно поднят." -ForegroundColor Green
            return
        }
    }

    Write-Warning "Ollama не поднялся автоматически. Проверьте вручную: ollama list"
}

Start-OllamaIfNeeded

Set-Location (Join-Path $PSScriptRoot "..\\infra")
if (!(Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
}
docker compose up -d --build
