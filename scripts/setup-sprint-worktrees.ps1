<#
.SYNOPSIS
  Create separate worktrees for the Sprint 1, Sprint 2 and Sprint 3 demo snapshots.

.DESCRIPTION
  Each worktree checks out the repository as it looked at the end of that sprint, so
  you can record videos without disturbing your main working copy. Run this script
  from anywhere; it locates the repository from its own path.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/setup-sprint-worktrees.ps1
#>

param(
    [string]$ParentDirectory = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
)

$repoRoot = Split-Path $PSScriptRoot -Parent

$sprints = @(
    @{
        Name = "sprint1"
        Commit = "9162f6a"
        Title = "Sprint 1 - Samples, Compare, side-by-side diff, Load file"
    },
    @{
        Name = "sprint2"
        Commit = "e59b03e"
        Title = "Sprint 2 - Conflict list, counter, Accept A/B/Both, Merged Result, Undo/Redo"
    },
    @{
        Name = "sprint3"
        Commit = "origin/main"
        Title = "Sprint 3 - Final build with markers, Apply Merge, Download/Copy and restored features"
    }
)

Write-Host "Repository: $repoRoot"
Write-Host "Demo worktrees will be created in: $ParentDirectory"
Write-Host ""

foreach ($sprint in $sprints) {
    $target = Join-Path $ParentDirectory ("Team-13-" + $sprint.Name)

    if (Test-Path -LiteralPath $target) {
        Write-Host "[skip] $($sprint.Name): already exists at $target"
    }
    else {
        Write-Host "[create] $($sprint.Name): $($sprint.Title)"
        git -C $repoRoot worktree add --detach $target $sprint.Commit
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Could not create worktree for $($sprint.Name)."
            continue
        }
    }

    Write-Host "  Run the demo with:"
    Write-Host "    cd `"$target`""
    Write-Host "    npm install"
    Write-Host "    npm start"
    Write-Host ""
}

Write-Host "Sprint 1 uses 'npx serve' (usually http://localhost:3000)."
Write-Host "Sprint 2 and Sprint 3 use http-server (http://localhost:8080)."
Write-Host ""
Write-Host "When finished recording, remove the worktrees with:"
foreach ($sprint in $sprints) {
    Write-Host "  git -C `"$repoRoot`" worktree remove `"$(Join-Path $ParentDirectory ('Team-13-' + $sprint.Name))`""
}
