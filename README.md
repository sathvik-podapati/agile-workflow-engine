# Agile Workflow Engine 🚀

A full-stack, enterprise-grade Agile Kanban Workspace platform built with **React (Vite)** on the frontend and **Spring Boot (Java 17)** on the backend. Designed with glassmorphism aesthetics, workspace isolation, role-based access control (RBAC), live WebSocket updates, and email OTP security.

---

## 🛠️ Technology Stack & Architecture

*   **Frontend**: React, Vite, Custom HSL/HEX Design System, Lucide Icons, Native WebSockets
*   **Backend**: Spring Boot 3, Spring Data JPA, MySQL (with H2 fallback), Hibernate, WebSocket Handler
*   **Database**: MySQL 8 / H2 Persistent Database
*   **DevOps**: Docker, Docker Compose, Nginx, PowerShell Automation

---

## 🎨 Custom Design Palette

*   **Background**: `#0F1117`
*   **Sidebar & Columns**: `#171923`
*   **Cards & Inputs**: `#1F2430`
*   **Primary Accent**: `#5B8CFF`
*   **Secondary Accent**: `#8B5CF6`
*   **Success Tone**: `#22C55E`
*   **Warning Alert**: `#F59E0B`
*   **Danger Alert**: `#EF4444`
*   **Text Primary**: `#F8FAFC`
*   **Text Secondary**: `#94A3B8`

---

## ✨ Enterprise Capabilities

### 1. Workspace Isolation & Sharing
*   Multi-tenant architecture: Workspaces are private by default.
*   Workspace admins can invite members by username/role to grant explicit access.

### 2. Strict Role-Based Access Control (RBAC)
*   **Workspace Admin**: Full board management, column editing, member invitation, user creation/deletion.
*   **Contributor (Developer)**: Can move assigned task cards between **To Do**, **In Progress**, and **Done**.
*   **Quality Assurance (QA)**: Review cards in **Done**; can **Approve** (finalize) or **Reject** (send back to **To Do**).

### 3. Live WebSocket Updates
*   Real-time multi-user synchronization over `/ws-updates` WebSocket endpoints.
*   Automatic client board refresh when any team member modifies task positions or statuses.

### 4. Email OTP Password Reset
*   Two-step security verification for password changes using a 6-digit OTP generated via `POST /api/v1/users/send-otp`.

### 5. Smart User Soft Deletion
*   Deleting a user removes them from active lists, clears task assignments, and releases unique email/username constraints to allow re-registration with the same email address.

---

## 🚀 Quick Start & Deployment

### Option A: 1-Click Launch (Windows)
Run the startup script from PowerShell:
```powershell
.\start.ps1
```

### Option B: Docker Compose
Build and run the full stack via Docker:
```bash
docker-compose up --build
```
*   **Frontend**: [http://localhost:5173](http://localhost:5173)
*   **Backend**: [http://localhost:8085](http://localhost:8085)

### Option C: Manual Setup

#### 1. Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```

#### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 E2E Verification Suite

Run the automated integration test script:
```powershell
.\verify_api.ps1
```

---

## 👥 Seed Accounts

| Role | Username | Password | Email |
| :--- | :--- | :--- | :--- |
| **Workspace Admin** | `Sarah (Admin)` | `admin123` | `sarah.admin@enterprise.com` |
| **Developer** | `David (Developer)` | `dev123` | `david.dev@enterprise.com` |
| **QA Auditor** | `Alice (QA Auditor)` | `qa123` | `alice.qa@enterprise.com` |
