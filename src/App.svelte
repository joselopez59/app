<script lang="ts">
  import Sidebar from "./components/Sidebar.svelte";
  import FloorPlan from "./components/FloorPlan.svelte";
  import OptionsPanel from "./components/OptionsPanel.svelte";
  import {
    draggingItem,
    moveTable,
    djPosition,
    fotoBoxPosition,
    tables,
  } from "./lib/stores";
  import { followMouse } from "./lib/actions";
  import MonbergLogo from "./assets/Monberg-Logo-weiss.svg";

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
        }
      }
      if ($draggingItem.id) {
        // It's a table based drag
        const tableId = $draggingItem.id;
        // Check if dropped within floor plan?
        // We can just assume global drop updates position
        // We need to know if we are over the floor plan?
        // Or we just update position and set placed = true?

        // Get floor plan bounds (simplified)
        const floorPlanEl = document.querySelector(".floor-plan-container");
        if (floorPlanEl) {
          const rect = floorPlanEl.getBoundingClientRect();
          const x = e.clientX - rect.left; // Adjust these scaling factors as needed
          const y = e.clientY - rect.top;

          // If inside floor plan
          if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            // Update table position relative to floor plan internal coordinates
            // Our floor plan svg is 1000x600, centered in container?
            // This coordinate math is tricky without exact ref.
            // For now, let's map screen drop to a "placed" state at mouse.
            // Ideally, we'd use the drop event on the floor plan itself, but global handler is easier for cross-component drag.

            // Let's assume the .floor-plan (inner) is the target
            const floorInternal = document.querySelector(".floor-plan");
            if (floorInternal) {
              const internalRect = floorInternal.getBoundingClientRect();
              const finalX = e.clientX - internalRect.left;
              const finalY = e.clientY - internalRect.top;

              // Valid drop?
              if (finalX > 0 && finalX < 1000 && finalY > 0 && finalY < 600) {
                tables.update((curr) =>
                  curr.map((t) => {
                    if (t.id === tableId) {
                      // Center table on cursor
                      return {
                        ...t,
                        x: finalX - 70,
                        y: finalY - 35,
                        placed: true,
                      };
                    }
                    return t;
                  }),
                );
              }
            }
          }
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

<div class="app-container">
  <header class="app-header">
    <div class="logo-container">
      <img src={MonbergLogo} alt="Monberg Logo" class="brand-logo" />
    </div>
    <div class="title-container">
      <h1 class="gradient-title">TISCHANORDNUNG</h1>
    </div>
  </header>

  <main class="main-content-column">
    <div class="input-container">
      <Sidebar />
    </div>

    <div class="canvas-area-centered">
      <FloorPlan />
    </div>

    <div class="options-bar-container">
      <div class="section-label">Optionen</div>
      <div class="options-bar">
        <OptionsPanel />
      </div>
    </div>
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    background-color: #121212;
    display: flex;
    justify-content: center;
  }

  .app-container {
    width: 100%;
    max-width: 1920px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #000;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
    border-left: 1px solid #333;
    border-right: 1px solid #333;
    font-family: "Inter", sans-serif;
  }

  .app-header {
    height: 12%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    background-color: #1e1e1e;
    border-bottom: 2px solid #333;
    z-index: 20;
    position: relative;
    flex-shrink: 0;
  }

  .brand-logo {
    height: 80px;
    object-fit: contain;
  }

  .gradient-title {
    font-family: sans-serif;
    font-size: 2.5rem;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #fcd058 0%, #f38181 50%, #d83d3d 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .main-content-column {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    height: 85%;
  }

  /* Row 1: Input Container */
  .input-container {
    height: 100px;
    width: 100%;
    flex-shrink: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1e1e1e;
  }

  /* Row 2: Floor Plan */
  .canvas-area-centered {
    flex-grow: 1;
    position: relative;
    background-color: #f5f5f5;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Row 3: Options Bar */
  .options-bar-container {
    flex-shrink: 0;
    z-index: 10;
    background: #1e1e1e;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 1rem;
    border-top: 2px solid #333;
  }

  .section-label {
    color: #f38181; /* Matching gradient theme tone */
    font-size: 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0.5rem 0;
  }

  .options-bar {
    width: 100%;
    height: auto;
    display: flex;
    justify-content: center;
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
    margin-left: -30px;
    margin-top: -30px;
  }
</style>
