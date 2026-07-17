# E2E Backend API Verification Script for Agile Workflow Engine (Role-Based Access Control)
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting Agile Workflow Engine RBAC Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:8085/api/v1"

# Helper function to invoke requests with User ID headers
function Invoke-RestWithAuth {
    param(
        [string]$Uri,
        [string]$Method = "Get",
        [string]$UserId = "",
        [object]$Body = $null
    )
    
    $headers = @{}
    if ($UserId) {
        $headers.Add("X-User-Id", $UserId)
    }
    
    $params = @{
        Uri = $Uri
        Method = $Method
        Headers = $headers
    }
    
    if ($Body) {
        $params.Add("Body", ($Body | ConvertTo-Json))
        $params.Add("ContentType", "application/json")
    }
    
    return Invoke-RestMethod @params
}

# 1. Fetch Seeded Users
Write-Host "`n1. Loading seeded enterprise users..." -ForegroundColor Yellow
$users = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get
Write-Host "Found $($users.Count) users in system:" -ForegroundColor Cyan

$sarah = $users | Where-Object { $_.role -eq "WORKSPACE_ADMIN" } | Select-Object -First 1
$david = $users | Where-Object { $_.role -eq "CONTRIBUTOR" } | Select-Object -First 1
$alice = $users | Where-Object { $_.role -eq "QUALITY_ASSURANCE" } | Select-Object -First 1

Write-Host "  - Administrator: $($sarah.username) (ID: $($sarah.id))" -ForegroundColor Green
Write-Host "  - Contributor: $($david.username) (ID: $($david.id))" -ForegroundColor Green
Write-Host "  - QA Auditor: $($alice.username) (ID: $($alice.id))" -ForegroundColor Green

# 2. Test User Creation Permissions
Write-Host "`n2. Testing user creation restrictions..." -ForegroundColor Yellow

# Contributor David tries to create a new user. Should be blocked (403).
try {
    $randomNum = Get-Random -Minimum 1000 -Maximum 9999
    $newUserPayload = @{ username = "Bob (Developer) $randomNum"; email = "bob_dev_$randomNum@enterprise.com"; role = "CONTRIBUTOR"; password = "dev123" }
    Invoke-RestWithAuth -Uri "$baseUrl/users" -Method Post -UserId $david.id -Body $newUserPayload
    throw "Security Failure: Contributor created a user!"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "Correct: Contributor David blocked from creating users (403 Forbidden)." -ForegroundColor Green
    } else {
        throw $_
    }
}

# Admin Sarah creates a new QA Auditor Bob
Write-Host "Creating a new QA Auditor Bob using Admin Sarah..." -ForegroundColor Yellow
$randomNumQA = Get-Random -Minimum 10000 -Maximum 99999
$bobPayload = @{ username = "Bob (QA Auditor) $randomNumQA"; email = "bob_qa_$randomNumQA@enterprise.com"; role = "QUALITY_ASSURANCE"; password = "qa123" }
$bob = Invoke-RestWithAuth -Uri "$baseUrl/users" -Method Post -UserId $sarah.id -Body $bobPayload
Write-Host "Correct: Admin Sarah created QA Auditor Bob (ID: $($bob.id))." -ForegroundColor Green

# 3. Create Workspace (Admin Sarah)
Write-Host "`n3. Creating workspace as Admin Sarah..." -ForegroundColor Yellow
$wsPayload = @{ name = "Audit & Launch Sprint Board" }
$wsResponse = Invoke-RestWithAuth -Uri "$baseUrl/workspaces" -Method Post -UserId $sarah.id -Body $wsPayload
$wsId = $wsResponse.id
Write-Host "Workspace created: '$($wsResponse.name)' with ID: $wsId" -ForegroundColor Green

$columns = $wsResponse.columns
$todoCol = $columns | Where-Object { $_.name -eq "To Do" }
$inProgressCol = $columns | Where-Object { $_.name -eq "In Progress" }
$doneCol = $columns | Where-Object { $_.name -eq "Done" }

# 4. Test Multi-Tenant Sharing / Membership Boundaries
Write-Host "`n4. Testing workspace isolation boundaries..." -ForegroundColor Yellow

# Invite David to Workspace (using Admin Sarah)
Write-Host "Inviting Contributor David to workspace..." -ForegroundColor Yellow
$inviteRes = Invoke-RestWithAuth -Uri "$baseUrl/workspaces/$wsId/invite?memberId=$($david.id)" -Method Post -UserId $sarah.id
Write-Host "Invitation succeeded. Workspace member count: $($inviteRes.assignedMembers.Count)" -ForegroundColor Green

# Invite Alice to Workspace (using Admin Sarah)
Write-Host "Inviting QA Auditor Alice to workspace..." -ForegroundColor Yellow
$inviteRes2 = Invoke-RestWithAuth -Uri "$baseUrl/workspaces/$wsId/invite?memberId=$($alice.id)" -Method Post -UserId $sarah.id
Write-Host "Invitation succeeded. Workspace member count: $($inviteRes2.assignedMembers.Count)" -ForegroundColor Green

# Invite Bob to Workspace (using Admin Sarah)
Write-Host "Inviting newly created Bob to workspace..." -ForegroundColor Yellow
$inviteRes3 = Invoke-RestWithAuth -Uri "$baseUrl/workspaces/$wsId/invite?memberId=$($bob.id)" -Method Post -UserId $sarah.id
Write-Host "Invitation succeeded. Workspace member count: $($inviteRes3.assignedMembers.Count)" -ForegroundColor Green

# 5. Create task cards using Admin Sarah
Write-Host "`n5. Creating task cards using Admin Sarah..." -ForegroundColor Yellow
$task1Payload = @{ title = "Implement OAuth Security"; priority = "HIGH"; assigneeId = $david.id } # Assigned to David
$task2Payload = @{ title = "Review User Flows"; priority = "MEDIUM"; assigneeId = $alice.id }    # Assigned to Alice
$task3Payload = @{ title = "Design Color Palette"; priority = "LOW" }                            # Unassigned

$task1 = Invoke-RestWithAuth -Uri "$baseUrl/columns/$($todoCol.id)/tasks" -Method Post -UserId $sarah.id -Body $task1Payload
$task2 = Invoke-RestWithAuth -Uri "$baseUrl/columns/$($todoCol.id)/tasks" -Method Post -UserId $sarah.id -Body $task2Payload
$task3 = Invoke-RestWithAuth -Uri "$baseUrl/columns/$($todoCol.id)/tasks" -Method Post -UserId $sarah.id -Body $task3Payload

Write-Host "Created Task 1 (ID: $($task1.id), Assigned: $($task1.assigneeName))" -ForegroundColor Green
Write-Host "Created Task 2 (ID: $($task2.id), Assigned: $($task2.assigneeName))" -ForegroundColor Green
Write-Host "Created Task 3 (ID: $($task3.id), Assigned: Unassigned)" -ForegroundColor Green

# 6. Test Task Card Transition & QA Approval Workflow
Write-Host "`n6. Testing Developer-to-Done QA review loop..." -ForegroundColor Yellow

# David moves Task 1 from To Do -> In Progress
Write-Host "Contributor David moves Task 1 (assigned to him) from To Do -> In Progress..." -ForegroundColor Yellow
$movePayload = @{ targetColumnId = $inProgressCol.id; newSequenceIndex = 0 }
$movedTask1 = Invoke-RestWithAuth -Uri "$baseUrl/tasks/$($task1.id)/move" -Method Patch -UserId $david.id -Body $movePayload
Write-Host "Correct: David successfully moved Task 1 to Column: $($movedTask1.columnId) (In Progress)." -ForegroundColor Green

# David tries to move Task 1 from In Progress -> Done. 
# It should succeed but flag the task as awaitingQaApproval = true.
Write-Host "Contributor David attempts to drag Task 1 into Done..." -ForegroundColor Yellow
$moveDonePayload = @{ targetColumnId = $doneCol.id; newSequenceIndex = 0 }
$movedDone = Invoke-RestWithAuth -Uri "$baseUrl/tasks/$($task1.id)/move" -Method Patch -UserId $david.id -Body $moveDonePayload

if ($movedDone.awaitingQaApproval -eq $true) {
    Write-Host "Correct: Card transitioned to Done column with awaitingQaApproval = true." -ForegroundColor Green
} else {
    throw "Workflow Failure: Task reached Done column without triggering awaitingQaApproval flag!"
}

# Contributor David tries to approve the task himself. Should be blocked (403).
try {
    Invoke-RestWithAuth -Uri "$baseUrl/tasks/$($task1.id)/approve" -Method Patch -UserId $david.id
    throw "Security Failure: Contributor David approved his own task card!"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "Correct: Contributor David blocked from approving tasks (403 Forbidden)." -ForegroundColor Green
    } else {
        throw $_
    }
}

# QA Alice rejects Task 1. Task should return to To Do column and awaitingQaApproval = false.
Write-Host "QA Alice reviews Task 1 and clicks REJECT..." -ForegroundColor Yellow
$rejectedTask = Invoke-RestWithAuth -Uri "$baseUrl/tasks/$($task1.id)/reject" -Method Patch -UserId $alice.id

if ($rejectedTask.columnId -eq $todoCol.id -and $rejectedTask.awaitingQaApproval -eq $false) {
    Write-Host "Correct: Task 1 rejected by QA and sent back to To Do column." -ForegroundColor Green
} else {
    throw "Workflow Failure: Rejecting task did not reset flag or return task to To Do!"
}

# Verify notifications generated for rejection
Write-Host "Verifying notifications for rejection..." -ForegroundColor Yellow
$davidNotifs = Invoke-RestWithAuth -Uri "$baseUrl/notifications" -Method Get -UserId $david.id
$sarahNotifs = Invoke-RestWithAuth -Uri "$baseUrl/notifications" -Method Get -UserId $sarah.id

$rejectNotifDavid = $davidNotifs | Where-Object { $_.message -match "rejected by Alice" }
$rejectNotifSarah = $sarahNotifs | Where-Object { $_.message -match "rejected by Alice" }

if ($rejectNotifDavid -and $rejectNotifSarah) {
    Write-Host "Correct: Rejection notifications delivered to Developer David and Admin Sarah." -ForegroundColor Green
} else {
    throw "Notification Failure: Rejection did not notify developer or admin!"
}

# David moves Task 1 back to In Progress and then back to Done.
Write-Host "David moves Task 1 back to In Progress..." -ForegroundColor Yellow
$movedTask1 = Invoke-RestWithAuth -Uri "$baseUrl/tasks/$($task1.id)/move" -Method Patch -UserId $david.id -Body $movePayload
Write-Host "David submits Task 1 to Done again..." -ForegroundColor Yellow
$movedDone = Invoke-RestWithAuth -Uri "$baseUrl/tasks/$($task1.id)/move" -Method Patch -UserId $david.id -Body $moveDonePayload

# QA Auditor Bob (invited QA) approves Task 1. Task should remain in Done column and awaitingQaApproval = false.
Write-Host "QA Auditor Bob reviews Task 1 and clicks APPROVE..." -ForegroundColor Yellow
$approvedTask = Invoke-RestWithAuth -Uri "$baseUrl/tasks/$($task1.id)/approve" -Method Patch -UserId $bob.id

if ($approvedTask.columnId -eq $doneCol.id -and $approvedTask.awaitingQaApproval -eq $false) {
    Write-Host "Correct: Task 1 approved by QA Bob and finalized in Done column." -ForegroundColor Green
} else {
    throw "Workflow Failure: Approving task did not clear awaitingQaApproval or keep task in Done!"
}

# Verify notifications generated for approval
Write-Host "Verifying notifications for approval..." -ForegroundColor Yellow
$davidNotifsApp = Invoke-RestWithAuth -Uri "$baseUrl/notifications" -Method Get -UserId $david.id
$sarahNotifsApp = Invoke-RestWithAuth -Uri "$baseUrl/notifications" -Method Get -UserId $sarah.id

$approveNotifDavid = $davidNotifsApp | Where-Object { $_.message -match "approved by Bob" }
$approveNotifSarah = $sarahNotifsApp | Where-Object { $_.message -match "approved by Bob" }

if ($approveNotifDavid -and $approveNotifSarah) {
    Write-Host "Correct: Approval notifications delivered to Developer David and Admin Sarah." -ForegroundColor Green
} else {
    throw "Notification Failure: Approval did not notify developer or admin!"
}

# Test marking all as read for David
Write-Host "Testing bulk mark as read..." -ForegroundColor Yellow
Invoke-RestWithAuth -Uri "$baseUrl/notifications/read" -Method Post -UserId $david.id
$davidNotifsRead = Invoke-RestWithAuth -Uri "$baseUrl/notifications" -Method Get -UserId $david.id
$unreadCount = ($davidNotifsRead | Where-Object { $_.readStatus -eq $false }).Count

if ($unreadCount -eq 0) {
    Write-Host "Correct: All notifications marked as read successfully." -ForegroundColor Green
} else {
    throw "Notification Failure: Bulk read did not clear readStatus!"
}

# 7. Test Login, Comments, and Subtasks Features
Write-Host "`n7. Testing Login, Comments, and Subtasks features..." -ForegroundColor Yellow

# Test Login - Success
Write-Host "Verifying successful login for David..." -ForegroundColor Yellow
$loginPayload = @{ username = "David (Developer)"; password = "dev123" }
$loginRes = Invoke-RestMethod -Uri "$baseUrl/users/login" -Method Post -Body ($loginPayload | ConvertTo-Json) -ContentType "application/json"
if ($loginRes.id -eq $david.id) {
    Write-Host "Correct: David logged in successfully using credentials." -ForegroundColor Green
} else {
    throw "Authentication Failure: Login did not return the correct user object!"
}

# Test Login - Failure (invalid password)
Write-Host "Verifying failed login with invalid credentials..." -ForegroundColor Yellow
try {
    $badPayload = @{ username = "David (Developer)"; password = "wrongpassword" }
    Invoke-RestMethod -Uri "$baseUrl/users/login" -Method Post -Body ($badPayload | ConvertTo-Json) -ContentType "application/json"
    throw "Security Failure: Logged in with incorrect password!"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
         Write-Host "Correct: Login blocked with invalid credentials (403 Forbidden)." -ForegroundColor Green
    } else {
         throw $_
    }
}

# Test Comments - Post and Fetch
Write-Host "Adding a comment to Task 1 as Developer David..." -ForegroundColor Yellow
$commentPayload = @{ text = "Starting implementation of this task now." }
$newComment = Invoke-RestWithAuth -Uri "$baseUrl/tasks/$($task1.id)/comments" -Method Post -UserId $david.id -Body $commentPayload
if ($newComment.text -eq "Starting implementation of this task now." -and $newComment.author.username -match "David") {
    Write-Host "Correct: Comment added successfully." -ForegroundColor Green
} else {
    throw "Workflow Failure: Comment was not added or mapped correctly!"
}

# Test Subtasks - Create, Toggle, Delete
Write-Host "Adding checklist subtasks to Task 1 as Admin Sarah..." -ForegroundColor Yellow
$subtaskPayload1 = @{ title = "Design Database Tables" }
$subtaskPayload2 = @{ title = "Write Repository Class" }

$sub1 = Invoke-RestWithAuth -Uri "$baseUrl/tasks/$($task1.id)/subtasks" -Method Post -UserId $sarah.id -Body $subtaskPayload1
$sub2 = Invoke-RestWithAuth -Uri "$baseUrl/tasks/$($task1.id)/subtasks" -Method Post -UserId $sarah.id -Body $subtaskPayload2

if ($sub1.title -eq "Design Database Tables" -and $sub1.completed -eq $false) {
    Write-Host "Correct: Subtask 1 created as unchecked." -ForegroundColor Green
} else {
    throw "Workflow Failure: Subtask 1 was not created correctly!"
}

Write-Host "Checking off Subtask 1 as Developer David..." -ForegroundColor Yellow
$toggled = Invoke-RestWithAuth -Uri "$baseUrl/subtasks/$($sub1.id)/toggle" -Method Patch -UserId $david.id
if ($toggled.completed -eq $true) {
    Write-Host "Correct: Subtask 1 toggled to completed." -ForegroundColor Green
} else {
    throw "Workflow Failure: Subtask toggling did not check the completed status!"
}

Write-Host "Deleting Subtask 2 as Admin Sarah..." -ForegroundColor Yellow
Invoke-RestWithAuth -Uri "$baseUrl/subtasks/$($sub2.id)" -Method Delete -UserId $sarah.id
Write-Host "Correct: Subtask 2 deleted successfully." -ForegroundColor Green

# 8. Test User Deletion & Cascade Rules
Write-Host "`n8. Testing user deletion and cascade rules..." -ForegroundColor Yellow

# Contributor David tries to delete QA Auditor Bob. Should be blocked (403).
try {
    Invoke-RestWithAuth -Uri "$baseUrl/users/$($bob.id)" -Method Delete -UserId $david.id
    throw "Security Failure: Contributor deleted a user!"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "Correct: Contributor David blocked from deleting users (403 Forbidden)." -ForegroundColor Green
    } else {
        throw $_
    }
}

# Admin Sarah tries to delete Admin Sarah. Should be blocked (403/400).
try {
    Invoke-RestWithAuth -Uri "$baseUrl/users/$($sarah.id)" -Method Delete -UserId $sarah.id
    throw "Security Failure: Admin deleted an administrator account!"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "Correct: Admin Sarah blocked from deleting administrator accounts (403 Forbidden)." -ForegroundColor Green
    } else {
        throw $_
    }
}

# Admin Sarah deletes QA Auditor Bob. Should succeed.
Invoke-RestWithAuth -Uri "$baseUrl/users/$($bob.id)" -Method Delete -UserId $sarah.id
Write-Host "Correct: Admin Sarah successfully deleted QA Auditor Bob." -ForegroundColor Green

# Verify Bob is no longer in users list
$activeUsers = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get
$bobStillActive = $activeUsers | Where-Object { $_.id -eq $bob.id }
if ($null -eq $bobStillActive) {
    Write-Host "Correct: Deleted user Bob is no longer returned in active users list." -ForegroundColor Green
} else {
    throw "Workflow Failure: Deleted user Bob is still active in users list!"
}

# 9. Clean up Workspace (Admin Sarah deletes workspace)
Write-Host "`n9. Cleaning up workspace..." -ForegroundColor Yellow
# Invoke-RestWithAuth -Uri "$baseUrl/workspaces/$wsId" -Method Delete -UserId $sarah.id
Write-Host "Preserving workspace board data for web UI." -ForegroundColor Green

Write-Host "`nAll RBAC API assertions verified successfully!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
