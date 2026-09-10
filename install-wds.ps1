# install-wds.ps1 - Whiteport Design Studio installer
# Mirrors install.md Steps 2-4 (clone + pull).
# Steps 5-8 (config, command files, project tracker) are done by the agent after this script reports back.
#
# Usage (from project root):
#   powershell -ExecutionPolicy Bypass -File .\install-wds.ps1
#
# Safe to re-run. If a previous install exists, it is preserved unless it lacks a wds-version
# in install.md (Step 2 check), in which case the script prompts to remove it.

$ErrorActionPreference = 'Stop'

$repoUrl = 'https://github.com/whiteport-collective/whiteport-design-studio.git'
$userHome = $env:USERPROFILE
$wdsDir  = Join-Path $userHome '.claude\wds'
$cmdDir  = Join-Path $userHome '.claude\commands'

function Write-Info($msg) { Write-Host "[wds-install] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "[wds-install] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[wds-install] $msg" -ForegroundColor Yellow }

Write-Info "Home: $userHome"
Write-Info "Target: $wdsDir"

# Step 2: check existing install
if (Test-Path $wdsDir) {
    $existingInstall = Join-Path $wdsDir 'install.md'
    $hasVersion = $false
    if (Test-Path $existingInstall) {
        $head = Get-Content $existingInstall -TotalCount 20 -ErrorAction SilentlyContinue
        if ($head -match 'wds-version') { $hasVersion = $true }
    }

    if (-not $hasVersion) {
        Write-Warn "Older (non-versioned) WDS install found at $wdsDir."
        $ans = Read-Host "Remove it and continue? (yes/no)"
        if ($ans -ne 'yes') {
            Write-Warn "Aborting. Remove $wdsDir manually and re-run."
            exit 1
        }
        Remove-Item -Recurse -Force $wdsDir
        # Also clean any stale command files
        foreach ($f in 'saga.md','freya.md','mimir.md','sync.md') {
            $p = Join-Path $cmdDir $f
            if (Test-Path $p) { Remove-Item -Force $p }
        }
    }
    else {
        Write-Info "Existing WDS install detected with version metadata. Will pull latest."
    }
}

# Step 3: prepare + clone
$parentDir = Split-Path $wdsDir -Parent
foreach ($d in @($parentDir, $cmdDir)) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Force -Path $d | Out-Null
        Write-Info "Created $d"
    }
}

if (-not (Test-Path $wdsDir)) {
    Write-Info "Cloning $repoUrl -> $wdsDir"
    git clone $repoUrl $wdsDir
    if ($LASTEXITCODE -ne 0) {
        throw "git clone failed (exit $LASTEXITCODE)"
    }
    Write-Ok "Cloned."
}
else {
    Write-Info "Repo already present at $wdsDir (skipping clone)."
}

# Step 4: pull latest
Write-Info "Pulling latest from origin/main..."
git -C $wdsDir pull --ff-only
if ($LASTEXITCODE -ne 0) {
    Write-Warn "git pull returned $LASTEXITCODE - likely no upstream tracking. Continuing."
}

# Verify version
$installMd = Join-Path $wdsDir 'install.md'
if (Test-Path $installMd) {
    $firstLines = Get-Content $installMd -TotalCount 15
    $verLine = $firstLines | Where-Object { $_ -match 'wds-version' } | Select-Object -First 1
    if ($verLine) {
        Write-Ok "WDS installed: $($verLine.Trim())"
    }
    else {
        Write-Warn "install.md present but no wds-version found."
    }
}

Write-Ok "Steps 2-4 complete. Return control to the agent - it will now write wds-config.yaml, the 4 slash command files, and the project tracker."
