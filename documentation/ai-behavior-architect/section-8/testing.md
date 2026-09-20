# 🧪 Testing

The package ships a test suite covering the compiler, editor utilities, code generation, and key runtime invariants. Understanding what's tested helps you reason about what's *guaranteed* versus what's your responsibility.

## Test Layout

| Assembly | Files | What they cover |
|---|---|---|
| **Tests/Editor** (`SnivelerCode.AiBehavior.Tests.Editor`) | `BtCompilerIntegrationTests.cs` | `BtCompiler.Compile` on real `GraphAsset`s: node flattening, sibling ordering, sub-tree inlining, shared state slots, blackboard slot dedup, condition/float/hash pooling, parallel branch offsets, `NodeStateCount`/`BlackboardCount` sizing |
| | `BtCodeGeneratorTests.cs` | Stage-1 generation: `SystemsNote.g.cs` content, registry JSON, asmdef emission, content-hash gating (no rewrite when unchanged) |
| | `BtGraphUtilsTests.cs` | Graph editing utilities (link/port helpers, root detection) |
| | `BtSettingsTests.cs` | `BtSettings` defaults, `Instance` asset creation, authoring bake values |
| **Tests/Runtime** (`SnivelerCode.AiBehavior.Tests`) | `BtRuntimeLogicTests.cs` | runtime logic exercised in-world: runner transitions, decorator semantics, blackboard condition/modify operators (including the 0.001 epsilon), wait/delay/completion paths |
| | `BtParallelDeactivationTests.cs` | the **Parallel-abort path**: a running custom action under an abandoned branch receives a deactivation request (Tag disabled) — the guarantee described in [Composites](#composites) |
| | `BtUtilsTests.cs` | `BtUtils` helpers (hashing, prefab resolution) |

## Running the Tests

1. **Unity → Window → General → Package Manager → Testing** (or install *Packages → Testing* if absent).
2. **Window → General → Testing → Run All Tests** — both editor and runtime groups run. Runtime tests create their own world/entities and exercise real compiled blobs, so they are the authoritative source on runtime semantics.
3. For CI-style runs: `unity -batchmode -runTests -testFilter "SnivelerCode.AiBehavior.Tests"` (adjust to your Unity install path).

## What the Tests Guarantee (and what they don't)

**Guaranteed:**
* the compiler's structural invariants (flattening, sharing, sizing) — if a tree shape compiles differently than the tests expect, a test fails;
* the blackboard operator semantics (`Set/Inc/Dec`, comparisons with epsilon, overflow clamping);
* the Parallel-abort deactivation contract;
* decorator completion rules for the tested paths.

**Your responsibility (not covered by the package tests):**
* **your** custom actions — the generated system is compiled from your code; write tests for your own `Process` logic (they run as normal C# in editor test contexts, or in a runtime test world);
* tree *design* correctness — the framework executes your tree faithfully; whether the tree does what you intended is yours to verify (the [Visual Debugger](#runtime-visual-debugging) is the fastest tool for this);
* integration with *your* world (transform usage, scene layout, prefab registry presence per scene).

## Recommended Regression Checks When Upgrading

1. Run the package's full test suite after upgrading the package (behavior changes land with changelog entries; tests catch regressions).
2. Re-bake all agent scenes (`BtAgentAuthoring` bakes at bake time — a package upgrade changes generated code, so a re-bake picks up new system behavior).
3. If you changed any `[BtCondition]` components, Find/Condition/Change-Entity node configs, or custom action signatures: verify the generated assembly still compiles (BA0003 warnings surface there) and spot-check one agent per graph in Play Mode.
