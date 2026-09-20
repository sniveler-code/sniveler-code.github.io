# 🎛 Blackboard Nodes

Besides custom C# actions, you can read and write **named blackboard variables** directly with visual nodes. Both live under **Blackboard/** in the search window.

## ⚖️ Blackboard Condition

`Blackboard/Blackboard Condition` — a leaf gatekeeper. Reads one named variable and returns **Success** if the comparison holds, **Failure** otherwise.

**Inspector:**

| Field | Meaning |
|---|---|
| **Variable** | dropdown of the graph's named variables (by name; identity is the hash) |
| **Operator** | `Skip`, `Equal`, `NotEqual`, `Greater`, `Less` |
| **Value** | the static value to compare against (float field) |
| **Enable Output** | when on, the node grows a horizontal **output** port carrying this variable's hash — connect it to a custom action's `[BtBlackboard]` input so the same variable flows through |

**Runtime semantics (exact):**

* The variable's 4-byte slot is read as a **float** and compared:
  * `Equal` / `NotEqual` use a **0.001 absolute epsilon** (`|a − b| < 0.001`), not strict equality — integer-valued floats work fine with it,
  * `Greater` / `Less` are strict,
  * `Skip` (the default) never evaluates — the condition **always succeeds** (it's the "not configured" state, not a failure state).
* The node is a **terminal** node: single input flow port, no output flow port.

**Example:** variable `Health` (Float). Set `Health < 20` → when the agent's health drops below 20 the condition succeeds and the tree can proceed to a Flee branch.

## ✏️ Blackboard Modify

`Blackboard/Blackboard Modify` — a leaf that changes a variable. **Always returns Success** once applied.

**Inspector:**

| Field | Meaning |
|---|---|
| **Variable** | the variable to modify |
| **Operator** | `Skip`, `Set`, `Inc` (add), `Dec` (subtract) |
| **Value** | the static value |
| **Use DeltaTime** | when enabled, `Value` is **multiplied by `DeltaTime`** before the operation (per-frame accumulation — see below) |
| **Enable Output** | same output-port behavior as Condition |

**Runtime semantics (exact):**

* The slot holds one float; the operation is `current = Set ? value : current ± (value · Δt?)` and written back in the same frame.
* `Skip` leaves the value untouched (still returns Success).
* Because `int`/`bool` variables share the float slot, modifying them is done **in float space** — e.g. `Inc 1` on a bool toggles 0→1→2…; treat `Int`/`Bool` variables as float-backed integers/flags.

### The `Use DeltaTime` pattern

With **Use DeltaTime** on, each execution of the node applies `value · Δt` — i.e. it integrates *real time*. The node itself only runs when the tree reaches it, so to accumulate continuously you wrap it in an **infinite Repeater** (Repeater value `0`):

```
Sequence
└─ Repeater (value 0  = infinite)
   └─ Blackboard Modify  (Inc, Value 1, Use DeltaTime ✓)
      → variable increases by exactly 1.0 per real second
```

This is the idiomatic way to build a "time spent in state" counter.

## ⚡ Data-Port Outputs ("Enable Output")

Both nodes can expose their variable as a **data port** (the horizontal port on the right). The port's payload is the variable's *hash*, typed as the blackboard-variable marker type, so it can only connect to a **`[BtBlackboard]` input port of a custom action**:

```
Blackboard Modify (Health, Set, 100, Enable Output ✓)
        │ output (variable: Health)
        ▼
Action Custom → MoveAction.Process([BtBlackboard] ref float speed, …)
```

At runtime the generated job reads the variable's state slot before `Process`, passes it (by value or `ref`), and — for `ref` — writes the slot back **after** `Process` returns. This is the only way to hand a *named* variable to C#; everything else goes through `[BtInput]`/`[BtOutput]` data channels (see [The Blackboard System](#the-blackboard-system)).
