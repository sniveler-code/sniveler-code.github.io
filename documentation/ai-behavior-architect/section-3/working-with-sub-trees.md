# 🗂 Working with Sub-Trees

As AI logic grows, graphs become unwieldy. **Sub-Trees** let you encapsulate logic into smaller, reusable `GraphAsset`s — build an `AttackBehavior` once and drop it into every enemy type that needs it.

## 🏗 Setting Up a Sub-Tree

1. Create a new **AI Graph** asset (Create → Entities → Sniveler Code → AI Graph), e.g. `Sub_MeleeAttack`.
2. Open your **main** tree in the Behavior Editor.
3. Add a **Composites → Composite Sub-Tree** node.
4. Select it and assign the `Sub_MeleeAttack` asset in the **Node Settings** panel. The node's subtitle updates to the asset name.

At compile time the compiler **inlines** the sub-tree: it walks the sub-tree's root and flattens all of its nodes into the parent's flat node array (the `Sub-Tree` node itself acts as a transparent pass-through — its child list *becomes* the sub-tree's root children). The final `BtBlob` is one flat structure; there is no per-frame "enter sub-tree" indirection.

## 🧭 Navigating Sub-Trees

* **Dive in:** double-click the Sub-Tree node, or click **Open Sub-Tree** in its inspector. The editor loads the nested graph and the toolbar shows the breadcrumb trail (`Hierarchy -> Main -> Sub_MeleeAttack`).
* **Go back:** click a previous crumb in the toolbar.
* While viewing a sub-tree, the **Variables tab shows the sub-tree's own variables** — blackboard variables are per-graph (see below).

## ⚠️ Circular Dependency Protection

The compiler tracks a *visited graph stack* while flattening and **refuses to inline a graph that is already on the stack**:

```
[BtCompiler] Circular dependency detected! SubTree 'X' is already in the compilation stack. Skipping.
```

The editor additionally blocks the most common mistake directly: assigning a graph **to itself** via a Sub-Tree node logs `Cannot assign a tree to itself!` and reverts the field.

Note the check is *by asset name* — two different assets with identical names in the project will trip the guard. Keep graph names unique.

## 🧠 Blackboards & Sub-Trees

Blackboard variables are **per graph asset**, and the compiler **merges** them when flattening:

* Every variable of every inlined sub-tree is registered into the *same* shared-state table as the parent's variables, keyed by the variable's **hash** (FNV-1a of a GUID assigned when you create the variable).
* Two variables with the **same hash** (i.e. literally the same variable, copy-pasted across graphs) collapse into **one** state slot — that's how a sub-tree and its parent can read/write the *same* blackboard variable.
* Default values: each variable's authored default initializes its state slot at bake time. If parent and sub-tree both declare the same variable, the **last** initialization wins (sub-tree variables are registered before the parent's root is flattened).

> 💡 **Practical consequence:** to share a variable between a parent tree and a sub-tree, the variable must exist (with the same identity) in **both** graphs. A variable that only exists in the sub-tree is private to it.

## 🔍 Debugging Across Sub-Trees

In Play Mode the editor maps **flattened** node indices back to visual nodes — including through sub-trees. When a node inside the *open* sub-tree is active, its visual node lights up; when the flat index belongs to a sub-tree that is *not* currently open, the editor also highlights the corresponding **Sub-Tree node** in the parent (so you can tell "the activity is inside that sub-tree" without diving in).
