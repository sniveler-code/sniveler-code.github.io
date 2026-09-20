# 🎨 Interface Overview

The **Behavior Editor** is the central hub for authoring AI logic: **Window → Sniveler Code → AI Behavior Architect**. The window title is *Behavior Editor*. It is divided into three zones:

| Zone | Location | Contents |
|---|---|---|
| **Top Toolbar** | across the top | **Active Tree** — an object field for the `GraphAsset` to open; **Hierarchy breadcrumbs** — appear when you dive into Sub-Trees (`Hierarchy → Parent → Child`), clickable to jump back up |
| **Settings Panel** | left column | two stacked tabs — **Node Settings** (inspector for the selected node) and **Variables** (the graph's blackboard variables) — with the **Compile** button below them |
| **Graph Canvas** | right, main area | the infinite-grid node graph: pan/zoom, right-click or `Spacebar` to search & create nodes, drag-rectangle multi-select, standard copy/paste/undo |


## 🛠 1. The Top Toolbar

* **Active Tree** — an `ObjectField` for `GraphAsset`. Drag a graph here (or use the dropdown) to open it. The currently open graph is also restored automatically when you reopen the window (the last opened tree is remembered via PlayerPrefs).
* **Hierarchy breadcrumbs** — when you dive into Sub-Trees, the toolbar shows `Hierarchy -> Parent -> Child -> ...`. Click any previous crumb to jump back up; clicking the last item does nothing. Opening a *root* tree resets the breadcrumb trail.

## 🎛 2. The Settings Panel (Left)

A vertical panel with two stacked tabs plus the compile button:

* **Node Settings tab** — acts as an Inspector for the currently selected node (the node type name is shown as a header). Each node type draws its own fields:
  * numeric fields (`FloatField` / `IntegerField`) for timers, counters, cooldowns,
  * `EnumField` dropdowns for policies and modes,
  * component pickers for Find / Condition / Change-Entity,
  * the custom-action dropdown + generated parameter fields,
  * prefab `ObjectField`s where a node needs a prefab.
* **Blackboard (Variables) tab** — manages the graph's **named blackboard variables**: name, type (`Bool` / `Int` / `Float`) and default value. See [The Blackboard System](#the-blackboard-system).
* **Compile button** — persists the graph and runs code generation (see [Project Setup](#project-setup)).

## 🗺 3. The Graph Canvas (Right)

* **Navigation:** middle-mouse (or `Alt` + left-drag) pans, wheel zooms, `Spacebar` + drag also pans.
* **Add nodes:** right-click (or `Spacebar`) opens the **Node Search Window** — a grouped tree built from every `[GraphNode]`-registered node type. Search and click to create. The node is placed at the cursor position.
* **Selection:** left-click a node to select it (its inspector appears in the left panel). Multi-select with drag-rectangle.
* **Copy & Paste:** standard `Ctrl+C` / `Ctrl+V` — nodes are serialized to JSON, re-instantiated with **fresh GUIDs**, offset by (50, 50) and `Reset()` is called (e.g. Change-Entity drops its stored target). Edges between copied nodes are **not** recreated — reconnect them by hand.
* **Undo / Redo:** every structural mutation is recorded against the graph asset (`Undo.RecordObject`), so `Ctrl+Z` / `Ctrl+Shift+Z` works and the canvas rebuilds from the asset on undo.
* **Deleting:** select and `Delete`. Connected edges are removed with the node.

### Ports: Flow vs. Data

Every node exposes two port families:

| Port family | Visual position | Type | Capacity | Meaning |
|---|---|---|---|---|
| **Flow (logic) ports** | top / bottom of the node | `Flow` | Input: single · Output: multi (composites) / single (decorators, leaves) | Execution order. The *bottom* port is always the child connection point. |
| **Data ports** | left / right of the node | the payload's CLR type (or a marker type) | single, mostly multi for outputs | Pass runtime data (Entity, float3, blackboard variables) between specific nodes. |

Data port compatibility is **strictly by type**: a port can only connect to another port of the same port type (e.g. `Entity` → `Entity`, `float3` → `float3`, blackboard-variable → blackboard-variable). Compatible targets are highlighted while you drag.

> 📌 **Data ports are compile-time wiring.** When you connect two data ports, the *output port's hash* is copied into the input port's stored hash. Both then resolve to the **same blackboard slot** at compile time — the connection is not a runtime graph edge, it's a shared-memory index. See [The Blackboard System](#the-blackboard-system) for the full mechanism.

## 🔒 Play Mode: Read-Only Mode

On **Enter Play Mode** the editor:

1. saves the dirty graph asset,
2. recompiles if **Auto Compile On Save** is on,
3. locks the canvas: nodes can't be moved, ports are disabled, deletion is disabled (you'll get a warning if you try), the toolbar and variable panel are disabled, and the node inspector is cleared.

On **Exit Play Mode** the locks are released and all debug highlights are cleared. This prevents structural edits while the runtime is iterating over the blob.

## 💾 Saving & Auto-Save

* Structural edits mark the graph asset dirty; the window flushes dirty assets to disk on a **0.5 s** throttled tick (`BtGraphAutoSave.SaveInterval`).
* Entering Play Mode performs an **unthrottled** `AssetDatabase.SaveAssets()` first, so the bake never reads stale in-memory graph data.
* The graph *view state* (pan/zoom) is persisted into the asset (`GraphPosition` / `GraphScale`) and restored on load.

## 🚨 Broken Nodes

If a node's stored type can't be resolved (e.g. you deleted a custom action type, or the graph was made with an older version), the canvas shows a red **ErrorNode** placeholder and the build logs a warning. For custom nodes, a missing component is also flagged in the inspector ("Component mismatch …") with the stale type kept in the dropdown so you can swap it back. Broken custom nodes are **skipped by the code generator** — they won't break your compile, but the graph won't behave as drawn until you fix them.
