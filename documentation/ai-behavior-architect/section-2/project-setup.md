# ⚙️ Project Setup

Because **AI Behavior Architect** automatically writes C# code for you, you need to tell it where to save those generated scripts.

#### Configuring the Generator

1. In the top menu bar, navigate to **Edit > Project Settings**.
2. Select the **AI Behavior Architect** tab on the left-hand menu.
3. Locate the **Generated Directory** field.
4. Choose or create a folder where the framework will safely output the auto-generated DOTS systems.
   * Default path: `Assets/SnivelerCode/AiBehavior/Generated`
5. Ensure **Auto Compile On Save** is checked. This ensures your code backend updates seamlessly whenever you modify your visual graphs.

> ⚠️ **Important:** Do not manually edit the C# files inside your Generated Directory! They will be overwritten the next time you compile your Behavior Tree.

