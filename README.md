# RAIL-OPS — AI-Driven Railway Block Scheduling System

> **SIH 2026 | Smart India Hackathon**  
> AI-powered maintenance block planner for Indian Railways — optimising track downtime through Shadow Packing, multi-department coordination, and opportunistic delay repackaging.

---

## 🚆 Project Overview

RAIL-OPS is a full-stack operational dashboard that helps Railway controllers and department engineers plan, approve, and execute maintenance windows (blocks) with maximum efficiency. The core innovation is the **AI Shadow Packing Engine** — which bundles multi-department tasks into shared possession windows, achieving up to **3.4× multiplier** on block utilisation.

---

## 🏗️ Architecture

```
RAIL-OPS
├── Chief Controller Persona    → Full dashboard, live feed, block approval
└── Dept. Engineer Persona      → Dept-filtered backlog, read-only planner, restricted live feed
```

### Tech Stack

| Layer       | Technology                              |
|-------------|----------------------------------------|
| Frontend    | React 18 + TypeScript + Vite            |
| Styling     | Tailwind CSS (CDN + PostCSS)            |
| Icons       | Lucide-React + Material Symbols         |
| State       | Zustand (auth/role store)               |
| Routing     | React Router v6                         |
| Static Pages| Vanilla HTML/CSS (Tailwind CDN)         |

---

## 📁 Project Structure

```
ai-block-planner/
├── public/                         # Static HTML pages (prototype views)
│   ├── dashboard.html              # Chief Controller — Operational Dashboard
│   ├── backlog.html                # Chief Controller — Task Registry
│   ├── planner.html                # Chief Controller — AI Block Planner
│   ├── live.html                   # Chief Controller — Live Opportunity Feed
│   ├── eng-dashboard.html          # Dept. Engineer — Dashboard (Mode 2b)
│   ├── eng-backlog.html            # Dept. Engineer — Filtered Task Backlog
│   ├── eng-planner.html            # Dept. Engineer — Block Planner (Read-Only)
│   └── eng-livefeed.html           # Dept. Engineer — Live Feed (Restricted)
│
├── src/
│   ├── components/
│   │   ├── dashboard/              # KPI grid, sidebar, header, controller dashboard
│   │   ├── engineer/               # EngTaskBacklog — Dept Engineer task view
│   │   ├── rail/                   # App shell, task-backlog, block-planner (React)
│   │   ├── planner/                # Block inspector drawer
│   │   └── ui/                     # shadcn/ui primitives (button, input, etc.)
│   ├── pages/                      # Route-level page components
│   ├── store/                      # Zustand auth store (role, department)
│   ├── types/                      # Shared TypeScript types & entities
│   ├── mocks/                      # Mock data (defects, KPIs, delays, blocks)
│   └── api/                        # API hook stubs (ready for backend integration)
│
├── docs/                           # Reference designs & documentation
│   ├── designs/                    # Per-page design references (HTML + screenshots)
│   └── architecture/               # System design docs
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 👥 Personas & RBAC

### Chief Controller
| Page | Access |
|------|--------|
| Operational Dashboard | ✅ Full — all-department KPIs, live network |
| Task Registry (Backlog) | ✅ Full — all departments visible |
| AI Block Planner | ✅ Full — approve/modify blocks |
| Live Opportunity Feed | ✅ Full — accept/dismiss delay events |

### Department Engineer (TMS / SMMS / TDMS)
| Page | Access |
|------|--------|
| Dashboard (Mode 2b) | ✅ Dept-filtered — own department KPIs, crew, assets |
| Task Backlog | ✅ Dept-filtered — own department tasks only |
| Block Planner | 👁️ Read-Only — view Gantt, block inspector locked |
| Live Feed | ⚠️ Restricted — access-denied state |

---

## 🧠 Core Features

- **AI Shadow Packing Engine** — clusters multi-department tasks into shared blocks  
- **Asset Urgency Scoring** — 0–100 AI-computed score per asset (traffic density + overdue factor + failure risk)  
- **Shadow Compatibility Tags** — identifies tasks eligible for multi-department co-possession  
- **Crew Dispatch State** — real-time crew status (Deployed / Standby / En Route / Off Duty)  
- **Expandable Row Inspector** — AI reasoning + crew state revealed on row click  
- **Opportunistic Delay Repackaging** — live delay events surfaced as maintenance windows  

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open in browser
http://localhost:5173/
```

### Page Routes

| Route | Description |
|-------|-------------|
| `/` | Landing / Login |
| `/dashboard.html` | Chief Controller Dashboard |
| `/backlog.html` | Chief Controller Task Registry |
| `/planner.html` | AI Block Planner |
| `/live.html` | Live Opportunity Feed |
| `/eng-dashboard.html` | Engineer Dashboard (Mode 2b) |
| `/eng-backlog.html` | Engineer Task Backlog |
| `/eng-planner.html` | Engineer Block Planner (Read-Only) |
| `/eng-livefeed.html` | Engineer Live Feed (Restricted) |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Brand Mint | `#14C9A0` |
| Primary Green | `#006B54` |
| Signal Red | `#C13B3B` (Critical ≥90) |
| Signal Amber | `#E8A33D` (Caution 60–89) |
| Signal Green | `#3E8E5A` (Clear <60) |
| Background | `#F4FBF6` |
| Surface | `#FFFFFF` |

---

## 📄 License

MIT — Built for Smart India Hackathon 2026
