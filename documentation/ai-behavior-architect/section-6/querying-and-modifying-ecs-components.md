# 🔍 ECS Components in Custom Nodes

You do not need to write `SystemAPI.Query` or manual `ComponentLookup` plumbing to touch ECS data from an action. How data flows depends on *how you declare it* — and the declaration decides the **query membership** (see the query rule in [The Custom Action Execution Model](#the-custom-action-execution-model)).

## Reading Data — `in` (by value)

```csharp
private NodeStatus Process(in LocalTransform transform)
{
    float3 currentPos = transform.Position;
    return NodeStatus.Success;
}
```

* `T : IComponentData` as a bare (or `in`) parameter ⇒ the generated query uses `WithAll<T>` and the job reads a **read-only** chunk array.
* Cheapest access; the entity *must* have `T`.

## Writing Data — `ref`

```csharp
private NodeStatus Process(ref LocalTransform transform, [BtParam] float speed)
{
    transform.Position.y += speed * DeltaTime;
    return NodeStatus.Running;
}
```

* `ref T` ⇒ query uses `WithAllRW<T>` and the job writes back through the chunk array (the generated `Execute` re-stores `handleN[i] = value` after `Process`).
* Same entity-must-have-`T` rule.

## Buffers — `DynamicBuffer<T>`

```csharp
private NodeStatus Process(DynamicBuffer<AnimatorParameterData> params)
{
    var p = params[(int)index];
    p.Value = value;
    params[(int)index] = p;      // element write-back is explicit
    return NodeStatus.Success;
}
```

* `DynamicBuffer<T>` (`T : IBufferElementData`) as a parameter ⇒ query `WithAll<DynamicBuffer<T>>` (no `ref` needed on the buffer itself).
* Element access is copy-modify-write — assign the element back, as in any ECS job.
* The buffer must exist on the agent (buffers added by baking, or via `AddBuffer`).

## Random / Targeted Access — `ComponentLookup` & `BufferLookup` Fields

When you need to touch **another** entity (a Find result, a target from the blackboard) or a component you can't guarantee on every agent, declare a lookup **field**:

```csharp
[BtCustom("Combat/Apply Damage")]
public partial struct ApplyDamageAction
{
    // Exempt from the query — agents may lack these components
    public ComponentLookup<HealthComponent> Health;
    [ReadOnly] public ComponentLookup<LocalToWorld> Positions;

    private NodeStatus Process([BtInput] Entity target, [BtParam] float amount)
    {
        if (!Health.HasComponent(target)) return NodeStatus.Failure;

        var health = Health[target];
        health.Value -= amount;
        Health[target] = health;

        float3 pos = Positions[target].Position;
        BtLogger.BurstLog().Append(pos).Log();

        return NodeStatus.Success;
    }
}
```

* `ComponentLookup<T>` — read/write; add `[ReadOnly]` to the field for a read-only lookup (smaller, safer, Burst-verified).
* `BufferLookup<T>` — same idea for `DynamicBuffer<T>`; `TryGetBuffer(entity, out var buffer)`.
* Lookups give you `HasComponent` / `TryGetComponent` / `[entity]` — the idiomatic way to handle *optional* or *foreign* entities.
* ⚠️ Lookups are **not** parallel-safe across entities the job hasn't "claimed": for the agent's own entity prefer query components (the chunk gives you safe access); for other entities you are responsible for access correctness (this is standard ECS job practice — the generated job is a `ScheduleParallel` IJobChunk, so respect the usual parallel-for rules).

## The Agent's Own Entity

```csharp
private NodeStatus Process(in Entity self, in LocalTransform transform) { }
```

A bare `Entity` parameter (no attribute) receives the agent's own `Entity` — pair it with lookups to modify the self from outside the chunk, or pass it into ECB calls.

## Component Eligibility Compared

| Mechanism | Which components | Query membership | Typical use |
|---|---|---|---|
| `in` / `ref` parameter | any `IComponentData` (incl. engine types like `LocalTransform`) | **required** on the agent | the agent's own core data |
| `DynamicBuffer<T>` parameter | any `IBufferElementData` | **required** on the agent | the agent's own buffers |
| `ComponentLookup<T>` / `BufferLookup<T>` field | anything | **not required** | targets, optional components |
| Find / Condition / Change-Entity nodes | only `[BtCondition]`-tagged types | n/a (node systems) | visual world queries |

> 💡 **Rule of thumb:** agent's own data → parameters; someone else's data → lookups; visual/declarative logic → built-in query nodes.
