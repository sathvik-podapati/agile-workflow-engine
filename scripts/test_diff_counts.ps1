Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Testing GitHub Diff Line Counts         " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. octocat/Hello-World
$diff1 = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/ai/diff?repo=octocat/Hello-World&ref=7fd1a60b01f91b314f59955a4e4d4e80d8edf11d"
$count1 = ($diff1 -split "`n").Count
Write-Host "1. Repo: octocat/Hello-World (Commit: 7fd1a60...)" -ForegroundColor Yellow
Write-Host "   Diff Line Count: $count1 lines" -ForegroundColor Green

# 2. octocat/Spoon-Knife
$diff2 = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/ai/diff?repo=octocat/Spoon-Knife&ref=bb4ade920d363d63b27b952f20101b0f19c81163"
$count2 = ($diff2 -split "`n").Count
Write-Host "2. Repo: octocat/Spoon-Knife (Commit: bb4ade9...)" -ForegroundColor Yellow
Write-Host "   Diff Line Count: $count2 lines" -ForegroundColor Green

# 3. spring-projects/spring-boot
$diff3 = Invoke-RestMethod -Uri "http://localhost:8085/api/v1/ai/diff?repo=spring-projects/spring-boot&ref=main"
$count3 = ($diff3 -split "`n").Count
Write-Host "3. Repo: spring-projects/spring-boot (Commit: main)" -ForegroundColor Yellow
Write-Host "   Diff Line Count: $count3 lines" -ForegroundColor Green
