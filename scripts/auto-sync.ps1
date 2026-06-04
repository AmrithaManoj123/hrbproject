param(
    [int]$IntervalSeconds = 30,
    [switch]$Once
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

function Invoke-GitCommand {
    param([string[]]$Arguments)
    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

Write-Host "Auto sync is running in $repoRoot"
Write-Host "Press Ctrl+C to stop."

while ($true) {
    $status = git status --porcelain
    if ($status) {
        Write-Host "Changes detected at $(Get-Date -Format 'HH:mm:ss')"
        Invoke-GitCommand @('add', '--all')
        $staged = git diff --cached --stat
        if ($staged) {
            $message = "Auto sync $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
            Invoke-GitCommand @('commit', '-m', $message)
            Invoke-GitCommand @('pull', '--rebase', 'origin', 'main')
            Invoke-GitCommand @('push', 'origin', 'main')
            Write-Host "Pushed successfully."
        }
    }

    if ($Once) { break }
    Start-Sleep -Seconds $IntervalSeconds
}
