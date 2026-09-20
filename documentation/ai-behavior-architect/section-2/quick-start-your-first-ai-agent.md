# 🚀 Quick Start: Your First AI Agent

Let's build your first DOTS-driven AI agent from scratch. We'll create a simple behavior that makes an entity wait in place — then extend it into a real, reactive tree.

## Step 1 — Create the Behavior Graph

1. In the **Project** window, right-click anywhere.
2. Go to **Create → Entities → Sniveler Code → AI Graph** and name it, e.g. `MyFirstAgent`.
3. Open the editor: **Window → Sniveler Code → AI Behavior Architect**.
4. Drag the `MyFirstAgent` asset into the **Active Tree** slot in the top toolbar.

## Step 2 — Add Logic Nodes

1. Right-click the empty grid (or press `Spacebar`) to open the **Node Search Window**.
2. Search for **Composite Sequence** (under *Composites*) and click it to place a `Sequence` node.
3. Search for **Action Wait** (under *Actions*) and place a `Wait` node to its right.
4. Drag from the **bottom (Output) flow port** of the `Sequence` to the **top (Input) flow port** of the `Wait`.
5. Select the `Wait` node — in the left panel, set its **value** to, say, `3` (seconds).

> 📌 **Rule of thumb:** the node you connect *out of* is the **parent**, the node you connect *into* is the **child**. Trees always flow top → bottom. A graph has exactly one **root** — the node that no other node points at.

## Step 3 — Compile the Tree

1. In the left panel, click **Compile**.
2. Watch the **Console**: you should see `[BT Architect] Graph compiled successfully. Generating DOTS systems...` followed by a normal C# compile of the generated assembly.
3. Peek into your Generated Directory (`Assets/SnivelerCode/AiBehavior/Generated`): `SystemsNote.g.cs` now exists. (A bare `Sequence` + `Wait` tree needs no generated *action* systems — those only appear when you use Find / Condition / Change-Entity / custom actions.)

## Step 4 — Set Up the Agent Entity

1. Open a **Sub-Scene** (required for DOTS baking). If you don't have one yet: **Window → General → Scene** doesn't list sub-scenes — create one via the **Scene** window's *Sub Scenes* section, or use **Create → Entities → Sub Scene** in the Project window.
2. Create a new empty **GameObject** in that sub-scene, e.g. `AI Agent`.
3. Add the **`BtAgentAuthoring`** component and drag your `MyFirstAgent` graph into its **Tree** field.
4. *(Optional)* Add **`BtSettingsAuthoring`** to any GameObject in the sub-scene to tune the runtime:
   * **Max Iterations Per Frame** (default `50`) — the per-agent node-step budget per frame; raise it for very deep trees (see [Runtime Internals](#runtime-internals)).
   * **Log Infinite Loop Warnings** (default on) — logs an error when an agent hits the budget.

> ⚠️ **Baking requirements for `BtAgentAuthoring`:** the graph must not be empty and must have a **root node**. If the baker can't find a root you'll see `BtCompiler: Root node not found!` in the Console. Also note the agent needs a **transform** (`TransformUsageFlags.Dynamic`) — the baker always creates one.

## Step 5 — Bake and Play

1. Make sure the sub-scene is **closed** (not open in a Scene view) so it bakes on Play.
2. Press **Play**.
3. Open **Window → General → Entity Hierarchy** (provided by the Entities package) and select your `AI Agent` entity.
4. With the Behavior Editor still open, it automatically switches to the graph running on the selected entity — and you'll see the `Sequence` and `Wait` nodes light up **yellow** (Running). After ~3 seconds they flash **green** (Success) as the tree completes and restarts.

That's the full loop: **author → compile → bake → observe live.**

## Next Steps

* Add a **Blackboard** variable and a `Blackboard Condition` to make the wait duration data-driven — see [The Blackboard System](#the-blackboard-system).
* Build reusable chunks with [Sub-Trees](#working-with-subtrees).
* Write your first `[BtCustom]` C# action — see [Custom Nodes](#custom-nodes) and [The Custom Action Execution Model](#the-custom-action-execution-model).
