# 🔎 Queries & Transactions

These nodes interact directly with the DOTS ECS world, allowing you to query, spawn, and modify Entities visually without writing any code.

#### 📍 Find Node

Executes a highly optimized spatial hash query to locate other Entities in the world.

* **Configuration:**
  * **Max Distance:** The radius to search.
  * **Spatial Cell Size:** The chunk size of the internal grid (adjust for performance tuning).
  * **Find Method:** `First (fastest)`, `Nearest (checks distances)`, `Random`.
  * **Components Setup:** You must add at least one Component requirement. (e.g., Find an entity that has a `PlayerTag`). You can also add specific value conditions (e.g., Find a `HealthComponent` where `Value > 50`).
* **Outputs:** This node provides two Horizontal Data Ports. It outputs the found Entity ID and its float3 position. You can plug these into other nodes.

#### 🐣 Create Entity Node

Instantiates a Unity Prefab dynamically at runtime.

* **Configuration:**
  * **Entity:** Drag and drop a Unity `GameObject` Prefab here. (The framework will ensure it is baked into the DOTS registry).
  * **Min/Max Radius:** Spawns the entity at a random point within this radius around the target position.
  * **Position:** You can type a static `x,y,z` position, or connect a float3 `Data Port` to spawn the entity dynamically at a runtime location.

#### 🛠 Change Entity Node

Allows you to visually alter the component data of a specific Entity.

* **Configuration:**
  * **Input Entity (Data Port):** By default, this node modifies the Agent executing the tree (Self). If you connect an Entity `Data Port` (e.g., from a `Find node`), it will modify that targeted Entity instead.
  * **Components Setup:** Add the component you wish to modify.
  * **Transactions Tab:** Configure the math operators to apply to the component's data fields (`Set`, `Inc`, `Dec`).
