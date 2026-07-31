$devHeaders = @{ "Content-Type" = "application/json"; "X-User-Id" = "2" }

$payload = @{
    title = "Implement Automated Mail Dispatcher"
    description = "Dispatcher service for outbound emails"
    priority = "HIGH"
    gitRepo = "octocat/Hello-World"
    gitCommitHash = "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d"
} | ConvertTo-Json

Write-Host "1. Updating Task 23 with octocat/Hello-World..." -ForegroundColor Cyan
$updatedTask = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/tasks/23" -Method PUT -Headers $devHeaders -Body $payload

Write-Host "`n2. Triggering AI QA Auditor on Task 23..." -ForegroundColor Cyan
$auditPayload = @{ taskId = 23 } | ConvertTo-Json
$auditComment = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/ai/audit-task" -Method POST -Headers $devHeaders -Body $auditPayload

Write-Host "`n==================================================" -ForegroundColor Yellow
Write-Host " AI QA Review Comment Output for Non-Matching Repo" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host $auditComment.text
