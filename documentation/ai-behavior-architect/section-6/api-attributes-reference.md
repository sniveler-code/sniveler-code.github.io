# 🏷 API Attributes Reference

To pass data into and out of your `Process method`, you use specific attributes on your method parameters and struct fields. The code generator reads these attributes and wires up the UI and the ECS backend.

#### \[BtParam]

Marks a parameter as a static value. This exposes a field in the Node Inspector inside the Unity Editor, allowing designers to tweak the value.

* **Supported types:** int, float, bool, and enum.

```csharp
private NodeStatus Process([BtParam] float moveSpeed) { ... }
```

#### \[BtInput]

Retrieves a dynamic variable from the Agent's Blackboard at runtime. In the editor, this generates a **Horizontal Input Port** on the left side of the node.

```csharp
private NodeStatus Process([BtInput] Unity.Mathematics.float3 targetPosition) { ... }
```

#### \[BtOutput]

Writes a dynamic variable back to the Agent's Blackboard. In the editor, this generates a **Horizontal Output Port** on the right side of the node.

```csharp
private NodeStatus Process([BtOutput] out Unity.Mathematics.float3 currentPosition) { ... }
```

#### \[BtDeltaTime]

Applied to a struct field (not a method parameter). The code generator will automatically inject SystemAPI.Time.DeltaTime into this field before the job runs.

```csharp
[BtDeltaTime] public float DeltaTime;
```
