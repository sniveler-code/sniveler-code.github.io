# 🚀 Quick Start: Your First AI Agent

Let's build your very first DOTS-driven AI agent from scratch. We will create a simple behavior that tells an entity to simply wait in place.

#### Step 1: Create the Behavior Graph

1. Right-click anywhere in your Project window.
2. Go to `Create > Entities > Sniveler Code > AI Graph` and name it `MyFirstAgent`.
3. Open the editor by going to `Window/Sniveler Code/AI Behavior Architect`.
4. Drag and drop your new `MyFirstAgent` asset into the `Active Tree` slot in the editor toolbar.

#### Step 2: Add Logic Nodes

1. Right-click in the empty grid area (or press `Spacebar`) to open the **Node Search Window**.
2. Search for and add a `Sequence` node.
3. Right-click again and add an `Action Wait` node.
4. Connect the bottom output port of the `Sequence` node to the top input port of the `Wait` node.

#### Step 3: Compile the Tree

1. On the left-hand Settings Panel, click the **Compile** button.
2. Check your Unity Console. You should see a message indicating the graph compiled successfully and DOTS systems were generated.

#### Step 4: Setup the Agent Entity

1. Open a **Sub-Scene** in your Unity project (required for DOTS baking).
2. Create a new empty `GameObject` and name it AI Agent.
3. Add the `BtAgentAuthoring` component to this `GameObject`.
4. Drag your compiled `MyFirstAgent` Graph Asset into the **Tree** field of the authoring component.
5. (Optional) Add the `BtSettingsAuthoring` component if you wish to configure the maximum evaluation iterations per frame.

#### Step 5: Bake and Play!

1. Ensure your `Sub-Scene` is closed/baked.
2. Press **Play** in the Unity Editor.
3. While in Play Mode, select your AI Agent Entity using the `Entity Hierarchy` window.
4. Look at your Behavior Editor window—you will see the nodes light up **Yellow**, indicating that your unmanaged DOTS tree is successfully executing the Wait action!
