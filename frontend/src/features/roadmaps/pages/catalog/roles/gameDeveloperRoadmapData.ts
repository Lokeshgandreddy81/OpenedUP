export type GameDeveloperRoadmapStatus = "personal" | "alternative" | "optional";

export interface GameDeveloperRoadmapNode {
  id: string;
  title: string;
  status?: GameDeveloperRoadmapStatus;
  roadmapId?: string;
}

export interface GameDeveloperRoadmapGroup {
  id: string;
  parent?: GameDeveloperRoadmapNode;
  items: GameDeveloperRoadmapNode[];
}

export interface GameDeveloperRoadmapStage {
  id: string;
  node: GameDeveloperRoadmapNode;
  left?: GameDeveloperRoadmapGroup[];
  right?: GameDeveloperRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface GameDeveloperRoadmapSection {
  id: string;
  title?: string;
  stages: GameDeveloperRoadmapStage[];
}

export interface GameDeveloperRoadmapLink {
  label: string;
  roadmapId: string;
}

export const GAME_DEVELOPER_MARKERS: Array<{
  status: GameDeveloperRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const GAME_DEVELOPER_RELATED_ROADMAPS: GameDeveloperRoadmapLink[] = [
  { label: "C++ Roadmap", roadmapId: "skill-cpp" },
  { label: "C Programming", roadmapId: "skill-c-programming" },
  { label: "Rust Roadmap", roadmapId: "skill-rust" },
  { label: "Computer Science", roadmapId: "skill-computer-science" },
  { label: "Data Structures & Algorithms", roadmapId: "skill-dsa" },
  { label: "Server-Side Game Developer", roadmapId: "server-side-game-developer" },
];

export const GAME_DEVELOPER_CONTINUE_LEARNING: GameDeveloperRoadmapLink[] = [
  { label: "Server-Side Game Developer", roadmapId: "server-side-game-developer" },
  { label: "Design Architecture", roadmapId: "skill-design-architecture" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "C++", roadmapId: "skill-cpp" },
  { label: "Rust", roadmapId: "skill-rust" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: GameDeveloperRoadmapStatus,
  roadmapId?: string,
  customId?: string
): GameDeveloperRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: GameDeveloperRoadmapNode[],
  parent?: GameDeveloperRoadmapNode,
  customId?: string
): GameDeveloperRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<GameDeveloperRoadmapStage, "id" | "node"> & {
    status?: GameDeveloperRoadmapStatus;
    roadmapId?: string;
    customId?: string;
  } = {}
): GameDeveloperRoadmapStage => {
  const { status, roadmapId, customId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// --- SECTION 1: PROGRAMMING LANGUAGES & CORE FOUNDATIONS ---
const PROGRAMMING_FOUNDATIONS: GameDeveloperRoadmapSection = {
  id: "programming-foundations",
  title: "1. Programming Languages & Core Foundations",
  stages: [
    stage("Pick a Primary Language", {
      left: [
        g(
          [
            n("Manual Memory Management", "personal"),
            n("Pointers & References"),
            n("Templates & Metaprogramming"),
            n("Modern C++ (C++17 / C++20 / C++23)"),
            n("Standard Template Library (STL)"),
          ],
          n("C++ (Industry Standard AAA)", "personal", "skill-cpp")
        ),
        g(
          [
            n("Ownership & Borrow Checker"),
            n("Zero-cost Abstractions"),
            n("Bevy & Macroquad Ecosystem"),
          ],
          n("Rust (Emerging Modern Systems)", "alternative", "skill-rust")
        ),
      ],
      right: [
        g(
          [
            n("Unity Scripting Core"),
            n("Garbage Collection & Memory Spikes"),
            n("Async / Await & Coroutines"),
            n("C# Generics & LINQ Considerations"),
          ],
          n("C# (Unity & Godot Favorite)", "personal")
        ),
        g(
          [
            n("Lua (Embedded Scripting / Love2D)"),
            n("Python (Prototyping & Tools)", undefined, "skill-python"),
            n("GDScript (Godot Native)"),
          ],
          n("Scripting Languages", "optional")
        ),
      ],
      noteAfter:
        "C++ powers virtually all AAA engines (Unreal, proprietary in-house engines) for deterministic memory and performance. C# powers Unity and Godot. Pick based on your target engine.",
      projectIdea:
        "Console-based text adventure or 2D Snake game implemented with custom raw input handling in your chosen language",
    }),
    stage("Computer Science & Memory Architecture", {
      left: [
        g(
          [
            n("Stack vs Heap Allocation"),
            n("Memory Fragmentation & Arenas"),
            n("CPU Cache Lines & Cache Locality"),
            n("Data-Oriented Design (DOD)"),
          ],
          n("Memory Management & Hardware", "personal", "skill-computer-science")
        ),
      ],
      right: [
        g(
          [
            n("Arrays, Vectors & Ring Buffers"),
            n("Spatial Hash Grids & Quadtrees"),
            n("Binary Trees & Graphs"),
            n("Bitmasks & Flags"),
          ],
          n("Data Structures for Games", "personal", "skill-dsa")
        ),
      ],
      noteAfter:
        "Games demand cache-friendly code. Understanding memory layouts, CPU cache misses, and avoiding random pointer chasing is vital.",
    }),
  ],
};

// --- SECTION 2: MATHEMATICS & PHYSICS FOR GAMES ---
const MATHEMATICS_AND_PHYSICS: GameDeveloperRoadmapSection = {
  id: "mathematics-and-physics",
  title: "2. Mathematics & Physics for Games",
  stages: [
    stage("Game Mathematics", {
      left: [
        g(
          [
            n("Vectors (2D/3D, Addition, Normalization)", "personal"),
            n("Dot Product (Angles, Projections, FOV)", "personal"),
            n("Cross Product (Normals, Perpendiculars)", "personal"),
            n("Matrices & Transformations (Model, View, Projection)", "personal"),
            n("Quaternions vs Euler Angles & Gimbal Lock", "personal"),
          ],
          n("Linear Algebra", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Trigonometry (Sine, Cosine, ArcTan2)"),
            n("Cartesian & Polar Coordinates"),
            n("Interpolation: Lerp, Slerp, SmoothStep"),
            n("Coordinate Systems (World, Local, Screen, NDC)"),
          ],
          n("Geometry & Trigonometry", "personal")
        ),
        g(
          [
            n("Pseudo-random Number Generators (PRNG)"),
            n("Perlin & Simplex Noise for Procedural Gen"),
            n("Bezier Curves & Splines"),
          ],
          n("Curves, Noise & Calculus", "optional")
        ),
      ],
      noteAfter:
        "Linear algebra is the foundational mathematical language of games. Vector operations and quaternion rotations are used continuously.",
      projectIdea:
        "3D camera orbit controller using vectors and quaternion math without third-party math libraries",
    }),
    stage("Game Physics & Collision", {
      left: [
        g(
          [
            n("Axis-Aligned Bounding Box (AABB)", "personal"),
            n("Oriented Bounding Box (OBB)"),
            n("Circle / Sphere Intersection", "personal"),
            n("Raycasting & Line Segments", "personal"),
            n("Separating Axis Theorem (SAT)"),
          ],
          n("Collision Detection", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Kinematics: Velocity, Acceleration, Drag"),
            n("Newtonian Laws & Forces"),
            n("Impulse & Elastic/Inelastic Collisions"),
            n("Friction, Restitution & Gravity"),
            n("Verlet Integration & Euler Methods"),
          ],
          n("Rigid Body Simulation", "personal")
        ),
        g(
          [
            n("PhysX / Chaos Physics (Unreal)"),
            n("Box2D (2D Standard)"),
            n("Jolt Physics & Bullet"),
          ],
          n("Physics Engines", "optional")
        ),
      ],
      noteAfter:
        "Understanding discrete vs continuous collision detection prevents the common 'tunneling' bug where fast-moving bullets pass through walls.",
    }),
  ],
};

// --- SECTION 3: GAME ENGINES & LOW-LEVEL FRAMEWORKS ---
const GAME_ENGINES_AND_FRAMEWORKS: GameDeveloperRoadmapSection = {
  id: "game-engines-and-frameworks",
  title: "3. Game Engines & Low-Level Frameworks",
  stages: [
    stage("Choose Your Game Engine", {
      left: [
        g(
          [
            n("Unreal Engine 5 (C++ & Blueprints)", "personal"),
            n("Nanite Virtualized Geometry"),
            n("Lumen Real-Time Global Illumination"),
            n("Gameplay Ability System (GAS)"),
            n("Mass Entity (ECS)"),
          ],
          n("Unreal Engine (AAA & High Fidelity)", "personal")
        ),
        g(
          [
            n("Unity Engine (C# Ecosystem)", "personal"),
            n("Universal & HD Render Pipeline (URP/HDRP)"),
            n("Unity DOTS (Entities, Jobs, Burst)"),
            n("Prefab Workflows & Scene Management"),
          ],
          n("Unity (Indie, Mobile, 2D/3D)", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Godot 4 (GDScript, C#)"),
            n("Node-Tree Scene Architecture"),
            n("Lightweight & 100% Free / Open Source"),
            n("Vulkan-based Rendering"),
          ],
          n("Godot (Open-Source Rising Star)", "alternative")
        ),
        g(
          [
            n("SDL (Simple DirectMedia Layer)"),
            n("Raylib (Educational C/C++)"),
            n("Monogame / FNA (C# Framework)"),
            n("Bevy (Rust ECS Engine)"),
          ],
          n("Low-Level Frameworks", "optional")
        ),
      ],
      noteAfter:
        "Unreal is supreme for high-end 3D graphics and AAA team production; Unity excels across 2D, mobile, VR, and indie; Godot is lightweight and open-source.",
      projectIdea:
        "Recreate classic Pong or Breakout in both an engine (Unity/Godot) and a raw framework (Raylib/SDL) to appreciate the engine abstractions",
    }),
  ],
};

// --- SECTION 4: 2D & 3D GRAPHICS & RENDERING PIPELINE ---
const GRAPHICS_AND_RENDERING: GameDeveloperRoadmapSection = {
  id: "graphics-and-rendering",
  title: "4. 2D & 3D Graphics & Rendering Pipeline",
  stages: [
    stage("Graphics Pipeline & Shaders", {
      left: [
        g(
          [
            n("Vertex Specification & Buffers (VBO, VAO, EBO)"),
            n("Vertex Shader (Transforms & Projections)", "personal"),
            n("Rasterization & Triangle Interpolation"),
            n("Fragment / Pixel Shader (Colors & Textures)", "personal"),
            n("Depth Buffering, Stencil Buffer & Blending"),
          ],
          n("Render Pipeline Stages", "personal")
        ),
        g(
          [
            n("HLSL (DirectX & Unreal)", "personal"),
            n("GLSL (OpenGL & Vulkan)", "personal"),
            n("Shader Graph / Material Editor (Visual Shaders)"),
          ],
          n("Shader Languages", "personal")
        ),
      ],
      right: [
        g(
          [
            n("DirectX 12 / D3D11 (Windows/Xbox)", "personal"),
            n("Vulkan (Cross-Platform Modern)", "personal"),
            n("Metal (Apple Platforms)"),
            n("OpenGL & WebGL / WebGPU"),
          ],
          n("Low-Level Graphics APIs", "alternative")
        ),
        g(
          [
            n("PBR: Albedo, Roughness, Metallic, Normal"),
            n("Lighting: Ambient, Directional, Point, Spot"),
            n("Shadow Mapping & Cascaded Shadow Maps"),
            n("Post-Processing: Bloom, Tonemapping, SSAO"),
          ],
          n("Lighting & Material Models", "personal")
        ),
      ],
      noteAfter:
        "Modern game rendering relies heavily on Physically Based Rendering (PBR) and compute shaders. Visual shader graphs in Unreal/Unity compile down to HLSL.",
      projectIdea:
        "Write a custom water surface shader featuring vertex displacement waves, Fresnel reflection, and depth-based water foam",
    }),
    stage("2D Graphics & Asset Art Pipelines", {
      left: [
        g(
          [
            n("Sprite Sheets & Texture Atlases", "personal"),
            n("Tilemaps & Autotiling Rules"),
            n("2D Skeletal Animation (Spine, DragonBones)"),
            n("Parallax Scrolling Layers"),
          ],
          n("2D Rendering Techniques", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Mesh Topology, Quads vs Tris"),
            n("UV Unwrapping & Texture Coordinates"),
            n("LOD (Level of Detail) Systems"),
            n("Rigging, Skinning & Skeletal Hierarchies"),
          ],
          n("3D Asset Pipelines", "personal")
        ),
      ],
      noteAfter:
        "Texture atlasing and sprite batching minimize GPU draw calls, drastically improving 2D and mobile rendering performance.",
    }),
  ],
};

// --- SECTION 5: GAME ARCHITECTURE & DESIGN PATTERNS ---
const GAME_ARCHITECTURE_AND_PATTERNS: GameDeveloperRoadmapSection = {
  id: "game-architecture-and-patterns",
  title: "5. Game Architecture & Design Patterns",
  stages: [
    stage("Core Game Loop & System Architecture", {
      left: [
        g(
          [
            n("Entity Component System (ECS)", "personal"),
            n("Data-Oriented Components (Archetype/Sparse Sets)"),
            n("System Execution Scheduling & Dependencies"),
            n("Traditional OOP vs ECS Performance"),
          ],
          n("Entity Component Architecture", "personal", "skill-design-architecture")
        ),
      ],
      right: [
        g(
          [
            n("Fixed Timestep for Physics Simulation", "personal"),
            n("Variable Timestep for Rendering"),
            n("Frame Interpolation & State Accumulator"),
            n("Tick Rate & Delta Time"),
          ],
          n("The Game Loop", "personal")
        ),
        g(
          [
            n("Object Pooling (Bullet & Particle Reuse)", "personal"),
            n("Command Pattern (Undo/Redo & Replays)", "personal"),
            n("Observer / Event Bus (Decoupled Messaging)", "personal"),
            n("State Pattern (Player States & Game States)", "personal"),
            n("Service Locator & Singleton Caveats"),
          ],
          n("Essential Game Patterns", "personal")
        ),
      ],
      noteAfter:
        "The Game Programming Patterns book by Robert Nystrom is essential reading. Object pooling avoids memory garbage collection pauses in runtime loops.",
      projectIdea:
        "Implement an Entity Component System from scratch in C++ or C# with Position, Velocity, and Render components running at 60 FPS",
    }),
    stage("Asset Management & Serialization", {
      left: [
        g(
          [
            n("Save State & Game Slot Serialization"),
            n("Binary vs JSON / Protocol Buffers"),
            n("Checksums & Save File Tamper Protection"),
          ],
          n("Game State Serialization")
        ),
      ],
      right: [
        g(
          [
            n("Addressables / Soft Object References", "personal"),
            n("Asynchronous Asset Streaming"),
            n("Asset Bundles & Memory Unloading"),
            n("Scene Streaming & Level Partitioning"),
          ],
          n("Asset Streaming & Management", "personal")
        ),
      ],
      noteAfter:
        "Modern open-world games rely on asynchronous level streaming and soft object pointers so unused textures and models do not bloat RAM.",
    }),
  ],
};

// --- SECTION 6: GAME DESIGN, GAMEPLAY MECHANICS & FEEL ---
const GAME_DESIGN_AND_MECHANICS: GameDeveloperRoadmapSection = {
  id: "game-design-and-mechanics",
  title: "6. Game Design, Gameplay Mechanics & Game Feel",
  stages: [
    stage("Gameplay Systems & Controls", {
      left: [
        g(
          [
            n("Input Action Mapping (Keyboard, Mouse, Gamepad)", "personal"),
            n("Input Buffering & Coyote Time (Platformers)", "personal"),
            n("Character Controller (Kinematic vs Dynamic)"),
            n("Camera Systems (Cinemachine, Camera Shake, FOV)"),
          ],
          n("Player Controller & Input Handling", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Health, Damage & Status Effects", "personal"),
            n("Inventory & Item Systems"),
            n("Quest & Dialogue Trees"),
            n("Ability Cooldowns & Hitboxes / Hurtboxes"),
          ],
          n("Core Gameplay Mechanics", "personal")
        ),
        g(
          [
            n("Game 'Juice': Screen Shake, Hit Freeze, Flash"),
            n("Impact Feedback & Particle FX"),
            n("Tweening & Easing Animations"),
          ],
          n("Game Feel & Polish", "personal")
        ),
      ],
      noteAfter:
        "Coyote time (allowing jump for a few frames after falling off a ledge) and input buffering turn a clunky platformer into a responsive, fun game.",
      projectIdea:
        "Build a tight 2D platformer controller featuring wall sliding, dash, coyote time, and hit-stop camera freeze feedback",
    }),
    stage("UI / UX in Games", {
      left: [
        g(
          [
            n("Diegetic UI (In-world holograms, watch displays)"),
            n("Non-diegetic UI (HUD, Health bars, Mini-maps)", "personal"),
            n("Accessibility: Colorblind modes, Subtitles, Text sizing"),
          ],
          n("Game UI Paradigms", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Canvas Scaling & Multi-resolution Support"),
            n("Gamepad / Keyboard UI Navigation & Focus"),
            n("UI Toolkit / Unreal UMG / ImGui"),
          ],
          n("UI Implementation Systems", "personal")
        ),
      ],
      noteAfter:
        "Ensuring game UI works smoothly with gamepad navigation, variable screen ratios, and accessibility modes is crucial for commercial games.",
    }),
  ],
};

// --- SECTION 7: ARTIFICIAL INTELLIGENCE IN GAMES ---
const ARTIFICIAL_INTELLIGENCE: GameDeveloperRoadmapSection = {
  id: "artificial-intelligence",
  title: "7. Artificial Intelligence in Games",
  stages: [
    stage("Pathfinding & Spatial Navigation", {
      left: [
        g(
          [
            n("A* (A-Star) Pathfinding Algorithm", "personal"),
            n("Dijkstra & Breadth-First Search"),
            n("Hierarchical Pathfinding (HPA*)"),
            n("Dynamic Obstacle Avoidance (RVO / ORCA)"),
          ],
          n("Pathfinding Algorithms", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Navigation Mesh (NavMesh) Generation", "personal"),
            n("Off-Mesh Links (Jumping, Climbing Ladders)"),
            n("Steering Behaviors: Seek, Flee, Arrive, Wander"),
            n("Crowd Simulation & Flocking (Reynolds Boids)"),
          ],
          n("NavMesh & Steering", "personal")
        ),
      ],
      noteAfter:
        "A* on a polygon NavMesh is the industry standard for 3D navigation, supplemented by local collision avoidance (RVO).",
      projectIdea:
        "Implement a 2D flocking simulation with Boids (cohesion, alignment, separation) with predatory steering chasing them",
    }),
    stage("AI Decision Making & Behaviors", {
      left: [
        g(
          [
            n("Finite State Machines (FSM) & Hierarchical FSM", "personal"),
            n("State Transitions & Action Triggers"),
          ],
          n("State Machines", "personal")
        ),
        g(
          [
            n("Behavior Trees (Composites, Decorators, Actions)", "personal"),
            n("Blackboard Data Sharing"),
          ],
          n("Behavior Trees", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Goal-Oriented Action Planning (GOAP)", "alternative"),
            n("Utility AI (Scoring & Weighting Options)"),
            n("Perception Systems: Sight, Hearing, Noise stimuli"),
          ],
          n("Advanced AI Systems", "alternative")
        ),
      ],
      noteAfter:
        "Behavior Trees combined with Blackboards are the preferred tool in Unreal Engine and modern game engines for enemy AI combat behaviors.",
    }),
  ],
};

// --- SECTION 8: AUDIO IN GAMES ---
const AUDIO_IN_GAMES: GameDeveloperRoadmapSection = {
  id: "audio-in-games",
  title: "8. Audio Implementation & Sound Design",
  stages: [
    stage("Audio Middleware & Dynamic Audio", {
      left: [
        g(
          [
            n("Wwise (Audiokinetic Industry Standard)", "personal"),
            n("FMOD Studio (Indie & AA Favorite)", "personal"),
            n("Engine Native Audio (Unreal MetaSounds, Unity Audio)"),
          ],
          n("Audio Middleware", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Spatial Audio & 3D Panning", "personal"),
            n("Attenuation Curves, Reverb & Occlusion", "personal"),
            n("Doppler Shift Effect"),
            n("Interactive Music: Vertical Layering & Horizontal Re-sequencing"),
          ],
          n("Dynamic Audio Systems", "personal")
        ),
      ],
      noteAfter:
        "Middleware like FMOD and Wwise decouples sound designer workflows from programmers, enabling dynamic mixing and reactive parameter-driven music.",
    }),
  ],
};

// --- SECTION 9: OPTIMIZATION, PROFILING & DEBUGGING ---
const OPTIMIZATION_AND_PROFILING: GameDeveloperRoadmapSection = {
  id: "optimization-and-profiling",
  title: "9. Optimization, Profiling & Performance",
  stages: [
    stage("Profiling Tools & Bottleneck Analysis", {
      left: [
        g(
          [
            n("Frame Time Budgeting (16.6ms for 60fps, 8.3ms for 120fps)", "personal"),
            n("CPU vs GPU Bound Identification", "personal"),
            n("Unreal Insights / Unity Profiler", "personal"),
            n("RenderDoc & PIX for GPU Debugging", "personal"),
          ],
          n("Profiling & Diagnostics", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Multithreading & Task Workers", "personal"),
            n("Job Systems & Fiber-based Task Stealing"),
            n("SIMD Vectorization (SSE / AVX / NEON)"),
          ],
          n("CPU Optimization & Multithreading", "personal")
        ),
        g(
          [
            n("Draw Call Reduction & Batching", "personal"),
            n("Frustum & Occlusion Culling", "personal"),
            n("Texture Streaming & Mipmapping"),
            n("Overdraw Elimination & Early-Z"),
          ],
          n("GPU Optimization", "personal")
        ),
      ],
      noteAfter:
        "Always measure with a profiler before optimizing! The frame time budget (16.6ms for 60 FPS) must be partitioned across gameplay, physics, AI, and rendering.",
      projectIdea:
        "Profile a scene with 5,000 moving objects and optimize it from 15 FPS to 60+ FPS using batching and spatial partitioning",
    }),
  ],
};

// --- SECTION 10: PLATFORMS, MULTIPLAYER & PUBLISHING ---
const PLATFORMS_AND_PUBLISHING: GameDeveloperRoadmapSection = {
  id: "platforms-and-publishing",
  title: "10. Platforms, Deployment & Multiplayer",
  stages: [
    stage("Multiplayer Foundations", {
      left: [
        g(
          [
            n("Authoritative Server Model", "personal", "server-side-game-developer"),
            n("Client-Side Prediction & Reconciliation", "personal", "server-side-game-developer"),
            n("Snapshot Interpolation & Lag Compensation", undefined, "server-side-game-developer"),
          ],
          n("Networked Multiplayer", "personal", "server-side-game-developer")
        ),
      ],
      right: [
        g(
          [
            n("UDP vs TCP in Game Networking", "personal"),
            n("Unreal Replication System"),
            n("Unity Netcode for GameObjects"),
            n("Photon, Mirror & Nakama"),
          ],
          n("Game Netcode Frameworks")
        ),
      ],
      noteAfter:
        "For deep multiplayer server engineering, see the dedicated Server-Side Game Developer roadmap.",
    }),
    stage("Publishing & Platform SDKs", {
      left: [
        g(
          [
            n("Steamworks SDK (Achievements, Cloud Saves, Workshop)", "personal"),
            n("Console Certification (PlayStation, Xbox, Nintendo Switch)"),
            n("Mobile Store Pipelines (Google Play, Apple App Store)"),
          ],
          n("Platform Integration", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Continuous Integration & Automated Builds (GitHub Actions)"),
            n("Asset Packaging & Delta Patching"),
            n("Crash Reporting (Sentry, Backtrace) & Live Analytics"),
          ],
          n("CI/CD & Live Operations")
        ),
      ],
      noteAfter:
        "Passing console compliance testing (TRC on PlayStation, XR on Xbox) requires strict adherence to save-game handling, disconnection prompts, and controller changes.",
      projectIdea:
        "Complete a full game jam release: develop, build, package, and publish a complete mini-game on Itch.io or Steam",
    }),
  ],
};

export const GAME_DEVELOPER_SECTIONS: GameDeveloperRoadmapSection[] = [
  PROGRAMMING_FOUNDATIONS,
  MATHEMATICS_AND_PHYSICS,
  GAME_ENGINES_AND_FRAMEWORKS,
  GRAPHICS_AND_RENDERING,
  GAME_ARCHITECTURE_AND_PATTERNS,
  GAME_DESIGN_AND_MECHANICS,
  ARTIFICIAL_INTELLIGENCE,
  AUDIO_IN_GAMES,
  OPTIMIZATION_AND_PROFILING,
  PLATFORMS_AND_PUBLISHING,
];
