# 📥Installation & Requirements

Before importing AI Behavior Architect, please ensure your Unity project meets the necessary minimum requirements for DOTS development.

#### 📋 System Requirements

* **Unity Version**: 2022.2 or higher
* **Entities Package** (`com.unity.entities`): Version 1.4.5 or newer
* **Burst Compiler** (`com.unity.burst`): Version 1.8.27 or newer

> 💡 **Render Pipeline Compatibility**\
> The core AI framework is 100% render-pipeline agnostic. Because it relies purely on ECS and the Job System, you can use it in the **Built-in Render Pipeline**, **URP**, or **HDRP**. (Note: The included Demo Scene uses URP materials, but the AI logic functions universally).

#### 📦 Installation Steps

1. Open your Unity Project.
2. Ensure you have installed the **Entities** package via the Unity Package Manager.
3. Import the **AI Behavior Architect** `.unitypackage` into your project.
4. Unity will automatically resolve the remaining dependencies.
