# ⚙️Migration Guide: v1.1.0 to v1.3.0

This guide will walk you through the necessary steps to upgrade your project to the latest version of the GPU Animation Pro package. This update includes significant architectural improvements that increase stability, performance, and long-term scalability.

While many changes are internal and automatic, a few key updates require manual steps to ensure a smooth transition.

#### Summary of Key Benefits

* **Enhanced Stability:** A new Unique ID system for assets prevents errors when files are moved or renamed.
* **Improved Performance:** A new memory recycling system prevents memory leaks and ensures stable performance during long sessions.
* **Decoupled & Robust Architecture:** Core components now reference data assets directly, making the system more modular and less prone to scene-based configuration errors.

***

### Required Migration Steps

Please follow these steps in order to ensure your project is fully compatible with the new version.

#### 1. (CRITICAL) Backup Your Project

> **WARNING** Before proceeding with any package update, please ensure you have a complete and reliable backup of your project.

#### 2. Update the Package

Update the `com.snivelercode.gpu-animation-pro` package through the Unity Package Manager. After updating, you will likely see compilation errors. The following steps will resolve them.

#### 3. Rename Core System Component

The main system component has been renamed for better clarity. This is a breaking change that will likely cause compilation errors until it is fixed.

* **Old Name:** `AnimatorLodsSystem`
* **New Name:** `AnimatorLodSyncSystem`

**Action Required:**

* Search your codebase for any references to `AnimatorLodsSystem` and replace them with `AnimatorLodSyncSystem`.
* In your scenes, inspect any `GameObjects` that had the `AnimatorLodsSystem` script attached. The script reference will be missing. You must remove the old component and add the new `AnimatorLodSyncSystem` component.

#### 4. (IMPORTANT) Update `AnimatorRendererAuthoring` Asset References

> **IMPORTANT** This is a significant architectural change and the most critical manual step. The `AnimatorRendererAuthoring` component no longer references other `AnimatorAuthoring` components. It now directly references the animation data assets (`AnimatorMatricesAsset`).

* **Old Behavior:** `AnimatorRendererAuthoring` had a list that you would populate by dragging `GameObjects` with the `AnimatorAuthoring` component.
* **New Behavior:** `AnimatorRendererAuthoring` now has a list that you must populate by dragging the `AnimatorMatricesAsset` `ScriptableObject` files from your Project window.

**Action Required:**

1. Find all `GameObjects` in your scenes and prefabs that have an `AnimatorRendererAuthoring` component.
2. The list of animations on this component will now be empty or have missing references.
3. Lock the Inspector window showing the `AnimatorRendererAuthoring` component.
4. From the Project window, find your `AnimatorMatricesAsset` files (the `ScriptableObjects` containing the baked animation data).
5. Drag these asset files directly into the animation list on the `AnimatorRendererAuthoring` component.

**Why this change was made:** This decouples the rendering system from the source `GameObjects`, making it more robust. It's a key part of the new Unique ID system that prevents references from breaking when you rename or move things.

#### 5. Force Re-import of Animation Assets

The new version uses a robust Unique ID system for animation data assets. To ensure these IDs are generated and assigned correctly after the update, you must force a re-import.

**Action Required:**

* In the Unity Editor, locate the folder(s) containing your `AnimatorMatricesAsset` files.
* Right-click on the folder(s) and select **"Reimport"**.

This process will trigger the new `AnimatorMatricesAssetProcessor`, which automatically assigns the persistent unique IDs to your assets, ensuring the system works correctly.

#### 6. Review Attachments Configuration

The `Attachments` system has been internally refactored. While we have aimed to maintain compatibility, it is wise to double-check your setups.

**Action Required:**

* After completing the steps above, identify any characters or prefabs that use the Attachments feature.
* Enter Play Mode and verify that all attachments appear and function as they did previously. If not, review their configuration on the relevant `GameObjects`.

***

### Changes That Are Automatic (No Action Required)

The following improvements are included in this update and will work automatically after the package is installed:

* **GPU Index Recycling:** The new `AnimatorIndexAllocatorSystem` now manages memory automatically.
* **Safety Buffers:** A `DummyBuffer` is now used internally to prevent GPU-related errors.
* **Performance Optimizations:** Various internal optimizations, including the new GPU state buffer, will improve overall animation performance.

***

### Post-Upgrade Checklist

After performing the migration steps, please verify the following:

1. Ensure there are no compilation errors in the console.
2. Enter Play Mode in your main scenes.
3. Confirm that animations are playing correctly on your characters.
4. Verify that any dynamic features, like attachments, are working as expected.

By following this guide, you will successfully transition to the latest, most powerful version of GPU Animation Pro.
