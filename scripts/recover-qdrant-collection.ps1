param(
  [switch]$Apply,
  [string]$Collection = "local_rag_chunks"
)

$ErrorActionPreference = "Stop"

function Resolve-RequiredPath([string]$Path) {
  return (Resolve-Path -LiteralPath $Path).Path
}

function Assert-PathInside([string]$Child, [string]$Parent, [string]$Label) {
  $parentFull = [System.IO.Path]::GetFullPath($Parent).TrimEnd("\", "/")
  $childFull = [System.IO.Path]::GetFullPath($Child).TrimEnd("\", "/")
  $prefix = $parentFull + [System.IO.Path]::DirectorySeparatorChar
  if (
    -not $childFull.Equals($parentFull, [System.StringComparison]::OrdinalIgnoreCase) -and
    -not $childFull.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)
  ) {
    throw "$Label is outside expected workspace path: $Child"
  }
}

$repoRoot = Resolve-RequiredPath (Join-Path $PSScriptRoot "..")
$workspaceRoot = Join-Path $repoRoot "workspace"
$collectionsRoot = Join-Path $workspaceRoot "qdrant_data\collections"
$source = Join-Path $collectionsRoot $Collection
$backupRoot = Join-Path $workspaceRoot "qdrant_recovery_backups"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path $backupRoot "$Collection-broken-$timestamp"

if (-not (Test-Path -LiteralPath $source)) {
  throw "Collection directory not found: $source"
}

$resolvedWorkspace = Resolve-RequiredPath $workspaceRoot
$resolvedCollections = Resolve-RequiredPath $collectionsRoot
$resolvedSource = Resolve-RequiredPath $source

Assert-PathInside $resolvedCollections $resolvedWorkspace "collectionsRoot"
Assert-PathInside $resolvedSource $resolvedWorkspace "source"

Write-Host "Qdrant collection recovery"
Write-Host "Collection: $Collection"
Write-Host "Source:     $resolvedSource"
Write-Host "Backup:     $target"
Write-Host ""

if (-not $Apply) {
  Write-Host "Dry-run only. Nothing was moved."
  Write-Host "To apply: powershell -ExecutionPolicy Bypass -File scripts\recover-qdrant-collection.ps1 -Apply"
  exit 0
}

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
$resolvedBackupRoot = Resolve-RequiredPath $backupRoot
Assert-PathInside $resolvedBackupRoot $resolvedWorkspace "backupRoot"

Write-Host "Stopping qdrant..."
docker compose -f (Join-Path $repoRoot "infra\docker-compose.yml") stop qdrant | Out-Host

Write-Host "Moving collection to backup..."
Move-Item -LiteralPath $resolvedSource -Destination $target

Write-Host "Starting qdrant and kb-api..."
docker compose -f (Join-Path $repoRoot "infra\docker-compose.yml") up -d qdrant kb-api | Out-Host

Write-Host ""
Write-Host "Done. Next step:"
Write-Host "  1. Open http://localhost:8787/admin/qdrant-status"
Write-Host "  2. Run POST /admin/rebuild-qdrant with dryRun=false and confirm=REBUILD_QDRANT"
