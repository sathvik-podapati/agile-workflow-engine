$adminHeaders = @{ "Content-Type" = "application/json"; "X-User-Id" = "1" }

Write-Host "1. Testing Auto-Move to 'To Do' Column on Task 23 Assignment..." -ForegroundColor Cyan

$payload = @{
    title = "Implement Automated Mail Dispatcher"
    description = "Dispatcher service for outbound emails"
    priority = "HIGH"
    assigneeId = "2" # Assign to David (Developer)
} | ConvertTo-Json

$updatedTask = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/tasks/23" -Method PUT -Headers $adminHeaders -Body $payload

Write-Host "SUCCESS: Task 23 Assigned to Developer David!" -ForegroundColor Green
Write-Host "  - Assigned To: $($updatedTask.assigneeName)" -ForegroundColor Green
Write-Host "  - Column ID: $($updatedTask.columnId)" -ForegroundColor Green
