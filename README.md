<div align="center">

# 🎓 Learning Management System — Frontend

### React + TypeScript + Vite client for a full-stack MERN Learning Management Platform

**Developer:** [Pulindu Godage](https://github.com/pulidu)

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2.2-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?style=for-the-badge&logo=socketdotio)](https://socket.io/)

</div>

---

## 📖 Overview

The **Learning Management System (LMS) — Frontend** is a responsive single-page application that powers an online university platform. It delivers separate, role-aware experiences for **Administrators**, **Staff**, **Lecturers**, and **Students**, consuming the REST APIs exposed by the [LMS Backend](https://github.com/pulidu/lms-backend).

This repository contains **only the frontend**. No database or sensitive configuration lives here.

### Project Objectives

- Provide a single, modern interface for the complete academic workflow: users, courses, enrollments, attendance, exams, marks, and assignments.
- Enforce authentication and **role-based access** directly in the UI with protected routes.
- Manage state predictably with **Redux Toolkit** and communicate with the API through a single **Axios** client with automatic JWT refresh.
- Stay fast and maintainable using **TypeScript**, **Vite**, and a reusable **Tailwind CSS** design system.

**Live backend (consumed by this app):** `https://lms-backend-cyan-eight.vercel.app`

---

## ✨ Features

| Area | What is implemented |
| --- | --- |
| 🔐 **Authentication** | Login with email + password, 6-character email verification codes, "verify email" flow, forgot / reset password, and forced password change on first login |
| 🔄 **Token lifecycle** | Axios request interceptor attaches JWT; response interceptor automatically refreshes expired access tokens and retries the request |
| 👨‍💼 **Admin portal** | User management, staff management, course & subject management, batches, timetable scheduling, course enrollment |
| 👩‍🏫 **Staff / Lecturer portal** | Marks input & result publishing, attendance marking, assignment creation & grading, timetable and enrollment views |
| 🎓 **Student portal** | Personal dashboard, enrolled courses/subjects, marks & grades, timetable, self-service enrollment, assignment submission |
| 📊 **Reports** | Download academic & attendance reports as **PDF**; export subject marks as **Excel** |
| 🤖 **AI academic assistant** | In-app chatbot component answering from the student's live academic record |
| 🔔 **Real-time infrastructure** | Socket.IO client wired for notifications and announcements |
| 🧭 **Guards & navigation** | Role-based route guards redirect unauthenticated or unauthorized users to the correct portal |
| 📱 **Responsive UI** | Tailwind-based interface usable on desktop and mobile |

---

## 👤 Supported User Roles

| Role | Portal route | Typical capabilities in the UI |
| --- | --- | --- |
| **Admin** | `/admin` | Manage users, staff, courses, subjects, batches, timetables, enrollments |
| **Staff** | `/staff` | Manage students/lecturers, marks, attendance, assignments, timetables, enrollments |
| **Lecturer** | `/lecturer` | Marks input, attendance, assignments, timetables, enrollments |
| **Student** | `/student` | Dashboard, courses, marks, timetable, enrollment, assignments |

---

## 🛠️ Technology Stack

| Layer | Technology | Version |
| --- | --- | --- |
| UI framework | React (React DOM) | 19 |
| Language | TypeScript | 5.4 |
| Build tool | Vite | 5 |
| Styling | Tailwind CSS + PostCSS + Autoprefixer | 3.4 |
| State management | Redux Toolkit, React Redux | 2.2 / 9.1 |
| HTTP client | Axios (custom interceptors) | 1.7 |
| Routing | React Router | 6 |
| Forms / validation | React Hook Form, Zod, @hookform/resolvers | 7 / 3.8 / 3.9 |
| Real-time | socket.io-client | 4.7 |
| UI extras | Lucide React icons, Framer Motion, React Hot Toast | — |
| Charts | Recharts | 2.12 |

Versions above correspond to the declared ranges in `package.json`.

---

## 🏗️ Architecture

```text
Browser
  │
  └─ Vite dev server (port 5173)      ──☞ /api proxied to backend in development
       │
       React Router (public + protected routes)
       │
       Pages ── DashboardLayout ── Components
       │            │
       └── Redux store (auth slice) ── Auth state in localStorage
            │
            └── services/api.ts (single Axios instance)
                  • baseURL  = <VITE_API_BASE_URL>/api
                  • JWT Bearer header on every request
                  • auto refresh-token + retry on 401
                  • logout + redirect on refresh failure
            services/socket.ts (Socket.IO client)
            config/api.ts (single source of truth for URLs)
```

### Folder Structure

```text
frontend/
├── src/
│   ├── components/        # AIChatbot, StatsCard, reusable UI
│   ├── config/            # Centralized API & Socket URL configuration
│   ├── layouts/           # DashboardLayout (role-based navigation shell)
│   ├── pages/
│   │   ├── admin/         # Admin dashboard & management screens
│   │   ├── staff/         # Staff / lecturer screens
│   │   ├── student/       # Student screens
│   │   └── auth/          # Login, verification, password screens
│   ├── redux/             # Redux store + auth slice
│   ├── services/          # Axios API client + Socket.IO client
│   ├── index.css          # Global Tailwind styles
│   ├── main.tsx           # App entry, router & route guards
│   └── vite-env.d.ts      # Vite / import.meta.env type declarations
├── .env.example           # Safe example configuration (committed)
├── .env.production        # Public production API URL (committed)
├── index.html             # Root HTML document
├── vite.config.ts         # Vite config + dev proxy
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── Dockerfile             # Nginx container (optional)
```

---

## 🧰 Prerequisites

- **Node.js** ≥ 20
- **npm**
- A reachable instance of the [LMS Backend](https://github.com/pulidu/lms-backend) — local or deployed
- Git

---

## 🚀 Installation

```bash
# 1. Clone
git clone https://github.com/pulidu/lms-frontend.git
cd lms-frontend

# 2. Install dependencies
npm install

# 3. (Optional) Create local environment overrides
cp .env.example .env.local

# 4. Start the dev server
npm run dev
```

Open **http://localhost:5173**.

---

## ⚙️ Environment Variables

All environment configuration is centralized in [`src/config/api.ts`](src/config/api.ts). Full reference: [`.env.example`](.env.example).

| Variable | Required | Purpose | Example |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | No (dev) / Yes (prod) | Origin of the backend API — **without** the `/api` suffix | `https://lms-backend-cyan-eight.vercel.app` |
| `VITE_SOCKET_URL` | No | Optional Socket.IO origin; falls back to `VITE_API_BASE_URL` then the page origin | `https://lms-backend-cyan-eight.vercel.app` |

> **How the URL resolves**
> - `VITE_API_BASE_URL` set → Axios calls `<baseURL>/api/...` directly.
> - `VITE_API_BASE_URL` empty (local dev) → Axios uses `/api`, which the Vite dev server proxies to `http://localhost:5003` (see `vite.config.ts`). **No code change needed to switch backends.**

> [!IMPORTANT]
> `VITE_*` variables are exposed to the browser bundle. Only ever put **public, non-secret** values here. Never add API keys, JWT secrets, or database strings to a frontend `.env` file.

---

## 💻 Local Development

```bash
npm run dev       # Vite dev server with HMR on port 5173
```

The app starts fully functional against a local backend at `http://localhost:5003` (via the Vite proxy). All JWT handling, automatic token refresh, and authenticated requests are handled by the Axios interceptors in `src/services/api.ts`.

Local demo credentials (created by the backend seed):

```
Email:    admin@lms.com
Password: Admin@1234
```

---

## 📦 Production Build

```bash
npm run build     # tsc type-check + vite build
npm run preview   # preview the production bundle locally
```

The production build loads [`.env.production`](.env.production), which pins the app to the deployed backend:

```env
VITE_API_BASE_URL=https://lms-backend-cyan-eight.vercel.app
```

---

## 🔌 Backend API Integration

The frontend communicates with the backend exclusively through the Axios instance in [`src/services/api.ts`](src/services/api.ts):

- **Base URL** = `<VITE_API_BASE_URL>/api`, resolved from `src/config/api.ts`. Route paths already carry their `/api`-relative prefix (e.g. `POST /auth/login`), so no prefix is duplicated.
- **Request interceptor** adds `Authorization: Bearer <accessToken>` from `localStorage` when present.
- **Response interceptor** — on a `401`, calls `POST /auth/refresh-token` with the stored refresh token, saves the new token pair, and retries the original request. If refresh fails, the user is signed out and redirected to `/login`.
- **Socket.IO** connects through the same centralized config for real-time notifications/announcements.

API groups consumed by the UI:

| Prefix | Purpose |
| --- | --- |
| `/api/auth` | Login, registration, verification, password recovery, profile |
| `/api/academic` | Courses, subjects, batches, enrollments, attendance, exams, marks |
| `/api/assignments` | Assignments, file download, submissions, grading |
| `/api/notice` | Announcements, timetables, payments, notifications, user management |
| `/api/reports` | PDF / Excel report downloads |
| `/api/ai` | AI academic assistant chat |

The complete endpoint contract is documented in the [Backend README](https://github.com/pulidu/lms-backend).

---

## ☁️ Vercel Deployment (Frontend)

1. Push this repository to GitHub (`pulidu/lms-frontend`).
2. In the **Vercel Dashboard**, choose **Add New → Project** and import the repository.
3. Vercel auto-detects **Vite** (build: `npm run build`, output: `dist`).
4. Add an environment variable (Public):

   ```env
   VITE_API_BASE_URL=https://lms-backend-cyan-eight.vercel.app
   ```

5. Deploy. The variable set in Vercel overrides `.env.production` and is baked into the bundle at build time.

> [!TIP]
> No backend secrets are required by this repository. If the deployed backend's database is not reachable, the deployed frontend will be able to load, but API-backed screens will report network/500 errors — see the backend README's deployment status.

---

## 🐳 Docker (Optional)

The included `Dockerfile` serves the static build with Nginx:

```bash
docker build -t lms-frontend .
docker run -p 8080:80 lms-frontend
```

> [!NOTE]
> Build the image with `VITE_API_BASE_URL` supplied so the bundle points to the correct backend.

---

## 🧰 Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| "Network Error" on login | `VITE_API_BASE_URL` unreachable. Verify with `curl https://lms-backend-cyan-eight.vercel.app/health` |
| Requests to the wrong origin | Stale `.env.local` / `.env.production` / Vercel variable — config is centralized in `src/config/api.ts` |
| 401 then redirect to `/login` | Refresh token expired or secrets mismatched on backend; sign in again |
| 500 "Operation ... buffering timed out" | The **deployed backend cannot reach MongoDB** (issue verified Oct 2026) — see backend README |
| Real-time events not arriving | Socket.IO requires a long-running server; Vercel serverless apps cannot host persistent WebSockets |
| ESLint command fails | `npm run lint` is defined but ESLint is not installed as a dev dependency in this repo |
| Large bundle warning | Cosmetic Vite warning; code-split with `React.lazy` if desired |

---

## 📚 Related Repositories

| Repository | Link |
| --- | --- |
| Frontend (this repo) | https://github.com/pulidu/lms-frontend |
| Backend | https://github.com/pulidu/lms-backend |

---

## 👨‍💻 Developer

<div align="center">

### Pulindu Godage

Full-Stack Developer (MERN) · Software Engineering

[![GitHub](https://img.shields.io/badge/GitHub-Pulindu-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/pulidu)

</div>

---

<div align="center">
Built with React, TypeScript, Vite and Tailwind CSS.
</div>