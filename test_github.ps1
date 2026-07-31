$headers = @{ "Content-Type" = "application/json"; "X-User-Id" = "1" }

$payload = @{
    title = "Integrate Vite & React UI Shell"
    description = "Setup frontend vite build and scripts"
    priority = "HIGH"
    gitRepo = "octocat/Spoon-Knife"
    gitCommitHash = "bb4ade920d363d63b27b952f20101b0f19c81163"
} | ConvertTo-Json

Write-Host "1. Updating Task 19 with Public GitHub Repo (octocat/Spoon-Knife)..." -ForegroundColor Cyan
$updatedTask = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/tasks/19" -Method PUT -Headers $headers -Body $payload
Write-Host "Task Updated: GitRepo = $($updatedTask.gitRepo), GitCommitHash = $($updatedTask.gitCommitHash)" -ForegroundColor Green

Write-Host "`n2. Triggering AI QA Review Audit on Task 19..." -ForegroundColor Cyan
$auditPayload = @{ taskId = 19 } | ConvertTo-Json
$auditComment = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/ai/audit-task" -Method POST -Headers $headers -Body $auditPayload

Write-Host "`n==================================================" -ForegroundColor Yellow
Write-Host " AI QA Review Comment Generated for Public GitHub Repo" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host $auditComment.text
