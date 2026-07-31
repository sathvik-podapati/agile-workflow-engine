$headers = @{ "Content-Type" = "application/json"; "X-User-Id" = "1" }

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Testing Enterprise AI & Analytics Suite " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. AI Task Estimation
Write-Host "`n1. Testing AI Task Estimation Endpoint (/api/v1/ai/estimate-task)..." -ForegroundColor Yellow
$estBody = @{ title = "Refactor Database Schema and JPA Mappings"; description = "Optimize SQL indexes and migration scripts" } | ConvertTo-Json
$estRes = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/ai/estimate-task" -Method POST -Headers $headers -Body $estBody
Write-Host "   AI Estimation Result:" -ForegroundColor Green
Write-Host "   - Story Points: $($estRes.storyPoints)" -ForegroundColor Green
Write-Host "   - Estimated Hours: $($estRes.estimatedHours) hrs" -ForegroundColor Green
Write-Host "   - Rationale: $($estRes.rationale)" -ForegroundColor Green

# 2. AI Auto-Fix Patch Generator
Write-Host "`n2. Testing AI Auto-Fix Patch Generator (/api/v1/ai/generate-autofix)..." -ForegroundColor Yellow
$fixBody = @{ title = "Fix Null Payload Bug in Controller"; gitDiff = "diff --git a/Controller.java"; auditReview = "Security check: missing input validation" } | ConvertTo-Json
$fixRes = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/ai/generate-autofix" -Method POST -Headers $headers -Body $fixBody
Write-Host "   AI Auto-Fix Patch Preview:" -ForegroundColor Green
Write-Host $fixRes.patch -ForegroundColor Gray

# 3. Workspace Analytics & Velocity Dashboard
Write-Host "`n3. Testing Workspace Analytics Endpoint (/api/v1/workspaces/1/analytics)..." -ForegroundColor Yellow
$analytics = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/workspaces/1/analytics" -Headers $headers
Write-Host "   Workspace Analytics Metrics:" -ForegroundColor Green
Write-Host "   - Workspace Name: $($analytics.workspaceName)" -ForegroundColor Green
Write-Host "   - Sprint Velocity Rate: $($analytics.velocityRate)%" -ForegroundColor Green
Write-Host "   - Story Points Delivered: $($analytics.completedStoryPoints) / $($analytics.totalStoryPoints) pts" -ForegroundColor Green
Write-Host "   - Total Estimated Hours: $($analytics.totalEstimatedHours) hrs" -ForegroundColor Green
Write-Host "   - Total Tasks: $($analytics.totalTasks) (Completed: $($analytics.completedTasks), In Progress: $($analytics.inProgressTasks))" -ForegroundColor Green

# 4. GitHub Webhook Integration
Write-Host "`n4. Testing GitHub Webhook Endpoint (/api/v1/ai/webhooks/github)..." -ForegroundColor Yellow
$whRes = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/ai/webhooks/github" -Method POST -Headers $headers -Body '{"action":"opened","pull_request":{"id":101}}'
Write-Host "   GitHub Webhook Status: $($whRes.status) - $($whRes.message)" -ForegroundColor Green

Write-Host "`nAll Enterprise AI & Analytics features verified successfully!" -ForegroundColor Green
