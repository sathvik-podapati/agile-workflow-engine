$headers = @{ "Content-Type" = "application/json"; "X-User-Id" = "1" }

$payload = @{
    title = "Implement AI Service & Git Integration"
    description = "Add GitService class to fetch git diffs and pass diff content to AI QA Auditor"
    priority = "HIGH"
    gitRepo = "agile-workflow-engine"
    gitCommitHash = "HEAD"
} | ConvertTo-Json

Write-Host "1. Updating Task 19 with local repository ('agile-workflow-engine')..." -ForegroundColor Cyan
$updatedTask = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/tasks/19" -Method PUT -Headers $headers -Body $payload
Write-Host "Task Updated: GitRepo = $($updatedTask.gitRepo), GitCommitHash = $($updatedTask.gitCommitHash)" -ForegroundColor Green

Write-Host "`n2. Triggering AI QA Review Audit on Task 19..." -ForegroundColor Cyan
$auditPayload = @{ taskId = 19 } | ConvertTo-Json
$auditComment = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/ai/audit-task" -Method POST -Headers $headers -Body $auditPayload

Write-Host "`n==================================================" -ForegroundColor Yellow
Write-Host " AI QA Review Comment Generated for Real Code Diff" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host $auditComment.text
