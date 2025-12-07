<script lang="ts">
  import Sidebar from "./components/Sidebar.svelte";
  import FloorPlan from "./components/FloorPlan.svelte";
  import OptionsPanel from "./components/OptionsPanel.svelte";
  import {
    draggingItem,
    moveTable,
    djPosition,
    fotoBoxPosition,
  } from "./lib/stores";
  import { followMouse } from "./lib/actions";

  function handleMouseUp(e: MouseEvent) {
    if (!$draggingItem) return;

    if ($draggingItem.type === "dj" || $draggingItem.type === "fotobox") {
      const floorPlan = document.querySelector(".floor-plan");
      if (floorPlan) {
        const rect = floorPlan.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const x = e.clientX - rect.left - 50;
          const y = e.clientY - rect.top - 30;
          if ($draggingItem.type === "dj") djPosition.set({ x, y });
          if ($draggingItem.type === "fotobox") fotoBoxPosition.set({ x, y });
        }
      }
    }
    draggingItem.set(null);
  }
</script>

<svelte:window
  on:mousemove={(e) => {
    if ($draggingItem && $draggingItem.id) {
      moveTable($draggingItem.id, e.movementX, e.movementY);
    }
  }}
  on:mouseup={handleMouseUp}
/>

{#if $draggingItem && !$draggingItem.id}
  <div class="ghost-drag" use:followMouse>
    {$draggingItem.type === "dj" ? "🎧" : "📸"}
  </div>
{/if}

<main class="app-layout">
  <div class="sidebar-area">
    <Sidebar />
  </div>

  <div class="canvas-area">
    <FloorPlan />
  </div>

  <div class="options-area">
    <OptionsPanel />
  </div>
</main>

<style>
  .app-layout {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .sidebar-area {
    width: 320px;
    flex-shrink: 0;
    z-index: 10;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
  }

  .canvas-area {
    flex-grow: 1;
    position: relative;
    background-color: #000;
    overflow: hidden;
  }

  .options-area {
    width: 280px;
    flex-shrink: 0;
    z-index: 10;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.5);
  }

  .ghost-drag {
    position: fixed;
    top: 0;
    left: 0;
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.2);
    border: 2px dashed #fff;
    border-radius: 8px;
    pointer-events: none;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin-left: -30px; /* Center on mouse */
    margin-top: -30px;
  }
</style>
