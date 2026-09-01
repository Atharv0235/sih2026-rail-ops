# PROJECT CONTEXT BRIEF: RAIL-OPS (SIH26027)

**Project Identity**: AI-Powered Automatic Block Planning System for Indian Railways.

**Core Objective**: Transition railway maintenance scheduling from a decentralized, manual process into a data-driven, automated system that maximizes asset availability and train uptime.

## 1. The Core Problem (The Silos)
Currently, maintenance for Track, Signal, and Traction departments is planned independently via systems like TMS, SMMS, and TDMS. Because these departments are blind to each other, they request separate track closures for the same geographic area on different days, resulting in massive, unnecessary train delays.

## 2. Our Solution (The AI Middleware)
We are building a smart dashboard ecosystem that sits on top of these silos. It uses Operations Research (OR-Tools constraint solvers) and Machine Learning (Predictive Criticality) to mathematically cluster multi-department maintenance tasks into single, unified time blocks.

## 3. The 4 System Personas
The application enforces strict Role-Based Access Control (RBAC) to simulate real-world railway operations:
- **The Chief Controller (God-Mode)**: The boss of the division. They own the Train Timetable (COA) and have full visibility across all departments. They are the only user authorized to approve maintenance blocks and view live train delays.
- **SSE - P.Way (Track Engineer)**: Operates strictly within the TMS silo. Deals with rail fractures, chainage locations, and Traffic Blocks. Blind to other departments.
- **SSE - Signal (Signal Engineer)**: Operates strictly within the SMMS silo. Deals with point machines, signal IDs, and Disconnections. Blind to other departments.
- **SSE - TRD (Traction Engineer)**: Operates strictly within the TDMS silo. Deals with overhead electrical wires (OHE), mast numbers, and Power Blocks. Blind to other departments.

## 4. The Operational Workflow (The Closed Loop)
Antigravity must understand this 5-step lifecycle for every task in the system:
1. **Detection (Bottom-Up)**: A Department Engineer logs a defect (e.g., a rail fracture) in their isolated dashboard and requests a maintenance block.
2. **AI Prioritization (The Brain)**: Before the Controller sees the request, the AI assigns it a "Criticality Score" (1-100) based on defect severity and the track corridor's traffic density.
3. **Shadow Clustering (The X-Factor)**: The Chief Controller opens the Master Gantt chart, sees passing trains, and clicks "Run AI Shadow Optimizer." The AI mathematically stacks Track, Signal, and Traction tasks into a single time window (a "Mega Block").
4. **Execution (Top-Down)**: The Controller approves the Mega Block. The scheduled time instantly appears on the isolated, read-only Gantt charts of the respective Department Engineers.
5. **Completion**: The Engineers deploy their crews, complete the work, and mark the task as "Complete" in their dashboard, finalizing the data loop.

## 5. Dynamic Opportunistic Scheduling (The Reverse Loop)
The system is not just a static calendar; it is a live tactical engine.
- **White-Space Extraction**: If the Live Feed detects that a freight (goods) train is running 3 hours late, the system flags a sudden, unexpected "white space" on the track. The AI immediately alerts the Chief Controller and recommends a short-block schedule to squeeze in high-priority repairs. The Controller pushes this down to the engineers, reversing the standard workflow to exploit operational chaos.
