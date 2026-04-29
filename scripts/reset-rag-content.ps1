param(
    [string]$BaseUrl = "http://localhost:8787",
    [switch]$Force,
    [switch]$KeepRawFiles,
    [switch]$KeepParsedFiles,
    [switch]$KeepAssetFiles,
    [switch]$KeepUserNodes
)

$body = @{
    confirm = "RESET_LOCAL_RAG_CONTENT"
    force = $Force.IsPresent
    resetUserNodes = -not $KeepUserNodes.IsPresent
    deleteRawFiles = -not $KeepRawFiles.IsPresent
    deleteParsedFiles = -not $KeepParsedFiles.IsPresent
    deleteAssetFiles = -not $KeepAssetFiles.IsPresent
} | ConvertTo-Json

Invoke-RestMethod `
    -Method Post `
    -Uri "$BaseUrl/admin/reset-content" `
    -ContentType "application/json" `
    -Body $body
