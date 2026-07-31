# Agile Workflow Engine

An enterprise-grade, real-time Agile workflow management system built with **Spring Boot** and **React (Vite)**. Featuring a warm amber **Glassmorphism UI/UX**, workspace isolation, strict Role-Based Access Control (RBAC), interactive SVG analytics, AI QA Code Audit integration, and real-time WebSocket state synchronization.

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React 18, Vite, Warm Amber Glassmorphism Design System, Lucide Icons, Native WebSocket Client, Inline SVG Data Visualizations
- **Backend**: Spring Boot 3.4, Spring Data JPA, Hibernate ORM, MySQL 8 / H2 Persistent Database, WebSocket Message Broker, JavaMailSender
- **DevOps & Containers**: Docker, Docker Compose, Multi-Stage Nginx Build, Maven

---

## ✨ Core Capabilities & Features

### 🎨 1. Warm Glassmorphic Design System
- Modern dark-mode aesthetic with frosted glass panels (`backdrop-filter: blur`), subtle amber glows (`#E8A33D`), translucent card surfaces, and responsive edge-to-edge column layouts.
- Interactive SVG Analytics components:
  - **Radial Progress Ring Gauge**: Real-time sprint completion percentage indicator.
  - **Status Donut Chart**: Dynamic task breakdown (To Do, In Progress, Done).
  - **Sprint Burndown Curve Chart**: Cubic Bezier velocity trajectory comparing actual vs. ideal burn down.

### 🛡️ 2. Role-Based Access Control (RBAC) & Governance
- **Workspace Admin**: Full board authority, custom column management, member invitations, and task administration.
- **Contributor (Developer)**: Can move assigned task cards across workflow states (**To Do** ➔ **In Progress** ➔ **Done**).
- **Quality Assurance (QA Auditor)**: Reviews cards in **Done**; can **Approve** (finalize) or **Reject** (automatically returns task to **To Do** while preserving original assignee and state).

### 🤖 3. AI QA Auditor & Git Integration
- Integrates with Gemini AI service to audit task diffs, review code changes against requirements, and generate automated subtask checklists.

### 🔄 4. Real-Time WebSocket Synchronization
- Live multi-user state synchronization over WebSockets. Task moves, column modifications, and status changes instantly update across all connected client browsers.

---

## 🔑 Demo Login Credentials

For quick evaluation, pre-configured demo user accounts are provided:

| Role | Username | Email | Password |
| :--- | :--- | :--- | :--- |
| **Workspace Admin** | `Admin` | `admin@company.com` | `admin123` |
| **Developer** | `Developer` | `dev@company.com` | `dev123` |
| **QA Auditor** | `QA Auditor` | `qa@company.com` | `qa123` |

*Note: New accounts can also be created dynamically via the **Register Account** screen.*

---

## 🚀 Quick Start & Deployment

### Option A: Local Execution

#### 1. Start Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
*Backend runs on: `http://localhost:8085`*

#### 2. Start Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

### Option B: Multi-Container Docker Compose

Deploy the complete stack (MySQL 8 + Spring Boot API + React Nginx SPA) in one command:

```bash
docker-compose up --build
```
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:8085`
- **Database**: `localhost:3306`

---

## 📁 Repository Structure

```
agile-workflow-engine/
├── backend/                  # Spring Boot Java 17 Application
│   ├── src/main/java/        # Controllers, Services, Models, Repositories
│   ├── src/main/resources/   # Application Configuration (application.yml)
│   └── Dockerfile            # Multi-stage Maven/Java Dockerfile
├── frontend/                 # React SPA Application
│   ├── src/                  # Components, Hooks, Glassmorphic Design Tokens
│   └── Dockerfile            # Multi-stage Node/Nginx Dockerfile
├── docker-compose.yml        # Docker Multi-Container Orchestration
├── README.md                 # Project Overview & Quick Start
└── .gitignore                # Git Exclusions
```

