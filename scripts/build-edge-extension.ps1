$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceDirectory = Join-Path $projectRoot "edge-reader"
$releaseDirectory = Join-Path $projectRoot "release\edge-extension"
$manifestPath = Join-Path $sourceDirectory "manifest.json"

if (-not (Test-Path -LiteralPath $manifestPath)) {
  throw "Extension manifest not found: $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$version = [string]$manifest.version
if ($version -notmatch "^\d+\.\d+\.\d+(\.\d+)?$") {
  throw "Invalid extension version: $version"
}

& (Join-Path $PSScriptRoot "generate-extension-icons.ps1")
if (-not $?) {
  throw "Extension icon generation failed"
}
[System.IO.Directory]::CreateDirectory($releaseDirectory) | Out-Null

$packagePath = Join-Path $releaseDirectory "pagebetween-edge-extension-$version.zip"
if (Test-Path -LiteralPath $packagePath) {
  [System.IO.File]::Delete($packagePath)
}

$packageFiles = @(
  (Join-Path $sourceDirectory "manifest.json"),
  (Join-Path $sourceDirectory "background.js"),
  (Join-Path $sourceDirectory "content.js"),
  (Join-Path $sourceDirectory "PRIVACY.md"),
  (Join-Path $sourceDirectory "icons")
)

Compress-Archive -LiteralPath $packageFiles -DestinationPath $packagePath -CompressionLevel Optimal
$sha256 = [System.Security.Cryptography.SHA256]::Create()
try {
  $packageStream = [System.IO.File]::OpenRead($packagePath)
  try {
    $hashValue = $sha256.ComputeHash($packageStream)
  }
  finally {
    $packageStream.Dispose()
  }
}
finally {
  $sha256.Dispose()
}
$hashText = ([System.BitConverter]::ToString($hashValue)).Replace("-", "")
$hashPath = "$packagePath.sha256"
[System.IO.File]::WriteAllText($hashPath, "$hashText  $([System.IO.Path]::GetFileName($packagePath))`r`n")

Write-Output "Package: $packagePath"
Write-Output "SHA256: $hashText"
