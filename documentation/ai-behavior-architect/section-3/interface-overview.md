# 🎨 Interface Overview

The **AI Behavior Architect Editor** is your central hub for visually authoring AI logic. You can open it at any time via `Window/Sniveler Code/AI Behavior Architect`.

The editor is divided into three primary zones:

#### 🛠 1. The Top Toolbar

Located at the very top of the window, the toolbar manages which behavior tree you are currently editing.

* **Active Tree:** Drag and drop a `GraphAsset` here to open it.
* **Breadcrumbs / History:** When you dive into Sub-Trees (nested graphs), this area displays your navigation history (e.g., `Hierarchy -> PatrolBehavior -> OpenDoor`). Click on any previous name to jump back up the hierarchy.

#### 🎛 2. The Settings Panel (Left)

This side-panel contains the contextual settings for your graph and nodes.

* **Node Tab:** Whenever you select a node on the canvas, this tab acts as an Inspector. It allows you to configure parameters, dropdowns, and data specific to that node.
* **Variables Tab:** This is where you manage the **Blackboard** variables for the entire graph (we will cover this deeply in Section 4).
* **Compile Button:** Located at the bottom of the panel. Click this to trigger the code-generator and update your DOTS backend.

#### 🗺 3. The Graph Canvas (Right)

This is your infinite workspace.

* **Navigation:** Middle-click (or hold Alt + Left-click) to pan. Scroll to zoom.
* **Add Nodes:** Right-click anywhere (or press Spacebar) to open the Node Search window.
* **Ports:** Nodes connect via ports.
  * Top/Bottom Ports (Vertical): These are **Flow Ports**, used to define execution order (e.g., connecting a Sequence to an Action).
  * Left/Right Ports (Horizontal): These are **Data Ports**, used to pass Blackboard variables directly between specific nodes (like passing a spatial position to an entity spawner).

***

<br>
