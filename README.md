# Agile Workflow Engine 🚀

A premium, role-based Agile Kanban Workspace platform engineered with a React (Vite) frontend and a Spring Boot (Java) REST API backend. It features workspace isolation, custom role constraints, confirmation guards, and real-time docked notification alerts.

---

## 🛠️ Technology Stack

*   **Frontend**: React (JS), Vite, Lucide Icons, Glassmorphic CSS Styling
*   **Backend**: Spring Boot, Spring Data JPA, H2 Database (In-Memory), Lombok
*   **API Mappings**: REST JSON Endpoints (CORS enabled)

---

## ✨ Features & Capabilities

### 1. Multi-Tenant Workspace Isolation
*   Users can create multiple workspaces.
*   Workspaces are isolated; members only see data inside boards they have been explicitly invited to by the workspace creator.

### 2. Strict Role-Based Access Controls (RBAC)
*   **Workspace Admin**: Can rename/delete workspaces, add columns, create and edit tasks, invite members, and delete users from the system.
*   **Contributor (Developer)**: Can move task cards assigned to them from **To Do** to **In Progress** or **In Progress** to **Done**. Property editing and creating cards are locked.
*   **Quality Assurance (QA)**: Reviews cards dropped in **Done** and can either **Approve** (finalize) or **Reject** them (throwing them back to the **To Do** column).

### 3. Developer Done Drag Confirmation
*   Before a developer drags a card into the `Done` column, a confirmation pop-up warns them that it requires QA validation.

### 4. Real-Time Notification Alerts & Docked Sidebar
*   Real-time notifications are generated when a QA Auditor approves or rejects tasks, alerting both the developer (assignee) and the administrator (workspace creator).
*   A responsive **Notification Sidebar** slides open from the right side of the screen when clicking the Bell icon, dynamically adjusting the Kanban board's size side-by-side with no screen overlaps.
*   Features active polling with automated deduplication guards.

### 5. Administrative User Management
*   Administrators can delete users globally from the members modal.
*   **Cascading Soft Deletion**: Automatically unassigns the deleted user from all task cards and cleans up their workspace memberships.
*   Workspace admins are protected from deletion to avoid system lockouts.

---

## 🚀 Getting Started

### Prerequisites
*   Java Development Kit (JDK 17 or higher)
*   Maven 3.x
*   Node.js (v18 or higher) & npm

### Running the Backend Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Compile and start the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   *The backend starts on port **8085**.*

### Running the Frontend Client
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:5173](http://localhost:5173) in your browser.*

---

## 👥 Seed Test Accounts

The platform is pre-loaded with mock enterprise accounts to test role-based privileges:
1.  **Sarah (Workspace Admin)**: Workspace creator, holds full management privileges.
2.  **David (Contributor)**: Developer assignee.
3.  **Alice (Quality Assurance)**: QA Auditor.

---

## 🧪 E2E Integration Testing
The project includes a PowerShell integration test suite to verify role security and database workflow transitions:
```powershell
# Run from root folder
.\verify_api.ps1
```
