# 💻 Creating Your First Custom Node

While AI Behavior Architect provides powerful built-in nodes, the true strength of the framework is how easily you can write custom DOTS logic.

You write standard C# structs, and the framework’s Code Generator automatically writes the ECS boilerplate, creates the `ISystem`, queries the chunks, and schedules the multithreaded Burst jobs for you.

#### Step-by-Step: Creating an Action

1. Create a new C# script in your project (e.g., `LogMessageAction.cs`).
2. Define a partial struct (this is required because the code generator will create the other half of the struct).
3. Add the `[BtCustom]` attribute above the struct. This registers it in the visual editor.
4. Create a private `NodeStatus Process()` method. This is where your logic executes.

```csharp
using SnivelerCode.AiBehavior.Runtime.Attributes;
using SnivelerCode.AiBehavior.Runtime.Components;

namespace MyGame.AI
{
    // The string dictates the path in the Editor's Node Search Window
    [BtCustom("Debug/Log Action")]
    public partial struct LogMessageAction
    {
        // The generator automatically calls this Process method inside a Burst job
        private NodeStatus Process()
        {
            // Note: Because this runs in a Burst job, you must use Unity.Burst logging, 
            // not UnityEngine.Debug.Log!
            SnivelerCode.AiBehavior.Runtime.Utils.BtLogger.BurstLog()
                .Append("Hello from Burst!")
                .Log();

            return NodeStatus.Success;
        }
    }
}
```

1. Save the script.
2. Open the `Behavior Editor`, right-click, find `CustomAction` and search for `Debug/Log Action`. It is now a fully functional node!
