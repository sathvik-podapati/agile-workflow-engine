$qaHeaders = @{ "Content-Type" = "application/json"; "X-User-Id" = "3" } # User ID 3 (QA Auditor)

Write-Host "1. Rejecting Task 23 as QA Auditor..." -ForegroundColor Cyan
$rejectedTask = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/tasks/23/reject" -Method PATCH -Headers $qaHeaders

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "QA REJECTION VERIFICATION:" -ForegroundColor Green
Write-Host "  - Task Title: $($rejectedTask.title)" -ForegroundColor Green
Write-Host "  - Target Column Name: $($rejectedTask.columnBlock.name)" -ForegroundColor Green
Write-Host "  - Column ID: $($rejectedTask.columnId) (Column 17 = In Progress)" -ForegroundColor Green
Write-Host "  - Awaiting QA Flag: $($rejectedTask.awaitingQaApproval)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
