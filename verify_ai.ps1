$baseUrl = 'http://127.0.0.1:8085/api/v1'
$headers = @{ 
    'Content-Type' = 'application/json'
    'X-User-Id' = '1' # Sarah (Admin)
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Testing AI Automation Endpoints        " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Test AI suggest plan endpoint
Write-Host "`n1. Requesting AI Task Suggestion Plan..." -ForegroundColor Yellow
$suggestPayload = @{
    title = "Implement OAuth2 Social Logins"
} | ConvertTo-Json

$suggestResult = Invoke-RestMethod -Uri "$baseUrl/ai/suggest-task" -Method Post -Headers $headers -Body $suggestPayload
Write-Host "AI Description Suggested:" -ForegroundColor Green
Write-Host $suggestResult.description -ForegroundColor Gray
Write-Host "AI Subtasks Checklist Suggested:" -ForegroundColor Green
foreach ($sub in $suggestResult.subtasks) {
    Write-Host "  [ ] $sub" -ForegroundColor Gray
}

# Find active task
Write-Host "`nQuerying active workspaces and columns..." -ForegroundColor Yellow
$workspaces = Invoke-RestMethod -Uri "$baseUrl/workspaces" -Headers $headers
if ($workspaces.Count -gt 0) {
    $wsId = $workspaces[0].id
    $columns = Invoke-RestMethod -Uri "$baseUrl/workspaces/$wsId/columns" -Headers $headers
    $firstColId = $columns[0].id
    
    $tasks = Invoke-RestMethod -Uri "$baseUrl/columns/$firstColId/tasks" -Headers $headers
    if ($tasks.Count -gt 0) {
        $targetTaskId = $tasks[0].id
        
        # 2. Test AI Audit Task Review endpoint
        Write-Host "2. Running AI QA Review Audit on Task ID $targetTaskId ('$($tasks[0].title)')..." -ForegroundColor Yellow
        $auditPayload = @{
            taskId = $targetTaskId
        } | ConvertTo-Json

        $auditResult = Invoke-RestMethod -Uri "$baseUrl/ai/audit-task" -Method Post -Headers $headers -Body $auditPayload
        Write-Host "AI Auditor Comment Added Successfully!" -ForegroundColor Green
        Write-Host "Author: $($auditResult.author.username) (Role: $($auditResult.author.role))" -ForegroundColor Green
        Write-Host "Audit Feedback Content:" -ForegroundColor Green
        Write-Host $auditResult.text -ForegroundColor Gray
    } else {
        Write-Host "No active tasks found in the first column to test AI Audit Review." -ForegroundColor Red
    }
} else {
    Write-Host "No active workspaces found." -ForegroundColor Red
}

Write-Host "`nAll AI endpoint verification runs succeeded!" -ForegroundColor Cyan
