$adminHeaders = @{ "Content-Type" = "application/json"; "X-User-Id" = "1" }

Write-Host "1. Moving Task 23 to Column 16 (To Do)..." -ForegroundColor Cyan
$movePayload = @{ targetColumnId = 16; newSequenceIndex = 0 } | ConvertTo-Json
$movedTask = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/tasks/23/move" -Method PATCH -Headers $adminHeaders -Body $movePayload
Write-Host "Task 23 current Column: $($movedTask.columnId) ($($movedTask.columnBlock.name))" -ForegroundColor Yellow

Write-Host "`n2. Assigning Task 23 to Developer David (User ID 2)..." -ForegroundColor Cyan
$updatePayload = @{
    title = "Implement Automated Mail Dispatcher"
    description = "Dispatcher service for outbound emails"
    priority = "HIGH"
    assigneeId = "2"
} | ConvertTo-Json

$updatedTask = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/tasks/23" -Method PUT -Headers $adminHeaders -Body $updatePayload

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "VERIFICATION RESULT:" -ForegroundColor Green
Write-Host "  - Task Assignee: $($updatedTask.assigneeName)" -ForegroundColor Green
Write-Host "  - Target Column ID: $($updatedTask.columnId) (Column 17 = In Progress)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
