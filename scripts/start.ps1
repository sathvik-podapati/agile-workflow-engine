Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Starting Agile Workflow Engine Stack    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; mvn spring-boot:run"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev"

Write-Host "Backend launching at: http://localhost:8085" -ForegroundColor Green
Write-Host "Frontend launching at: http://localhost:5173" -ForegroundColor Green
