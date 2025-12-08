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

  let scale = 1;
  let showConfigPopup = false;
  let configTableId: number | null = null;
  let tempLabel = "";
  let isDragging = false;
  let dragStartTime = 0;

  function openConfigPopup(tableId: number) {
    configTableId = tableId;
    const table = $tables.find((t) => t.id === tableId);
    tempLabel = table?.label || "";
    showConfigPopup = true;
  }

  function closeConfigPopup() {
    showConfigPopup = false;
    configTableId = null;
    tempLabel = "";
  }

  function saveTableConfig() {
    if (configTableId !== null) {
      tables.update((curr) =>
        curr.map((t) =>
          t.id === configTableId ? { ...t, label: tempLabel } : t,
        ),
      );
    }
    closeConfigPopup();
  }

  function rotateConfigTable() {
    if (configTableId !== null) {
      tables.update((curr) =>
        curr.map((t) =>
          t.id === configTableId
            ? { ...t, rotation: (t.rotation + 45) % 360 }
            : t,
        ),
      );
    }
  }

  function setConfigTableType(type: "6" | "8") {
    if (configTableId !== null) {
      tables.update((curr) =>
        curr.map((t) => (t.id === configTableId ? { ...t, type } : t)),
      );
    }
  }

  function handleMouseUp(e: MouseEvent) {
    if (!$draggingItem) return;

    if ($draggingItem.type === "dj" || $draggingItem.type === "fotobox") {
      const floorPlan = document.querySelector(".floor-plan");
      if (floorPlan) {
        const rect = floorPlan.getBoundingClientRect();
        // Check if cursor is within the projected floor plan rect
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          // Logic for dropping extra items if verification needed
        }
      }

      // We rely on the ghost drag termination or future logic for these items
    }

    if ($draggingItem.id) {
      // It's a table based drag
      const tableId = $draggingItem.id;

      // Let's assume the .floor-plan (inner) is the target
      const floorInternal = document.querySelector(".floor-plan");
      if (floorInternal) {
        const internalRect = floorInternal.getBoundingClientRect();
        const finalX = e.clientX - internalRect.left;
        const finalY = e.clientY - internalRect.top;

        // Valid drop?
        // internalRect is the SCALED size.
        // 1000 * scale is the visual width.
        if (
          finalX > 0 &&
          finalX < internalRect.width &&
          finalY > 0 &&
          finalY < internalRect.height
        ) {
          tables.update((curr) =>
            curr.map((t) => {
              if (t.id === tableId) {
                // Center table on cursor, transformed to internal coordinates
                return {
                  ...t,
                  x: finalX / scale - 47,
                  y: finalY / scale - 23.5,
                  placed: true,
                };
              }
              return t;
            }),
          );
          // Don't open popup on drop from staging
        }
      }
    }

    draggingItem.set(null);
  }
</script>

<svelte:window
  on:mousemove={(e) => {
    if ($draggingItem && $draggingItem.id) {
      // Adjust movement by scale to keep 1:1 mouse-to-object tracking visually
      moveTable($draggingItem.id, e.movementX / scale, e.movementY / scale);
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
      <FloorPlan bind:scale onTableClick={openConfigPopup} />
    </div>

    <div class="options-bar-container">
      <div class="section-label">Optionen</div>
      <div class="options-bar">
        <OptionsPanel />
      </div>
    </div>
  </main>
</div>

{#if showConfigPopup}
  <div
    class="config-overlay"
    on:click={closeConfigPopup}
    role="dialog"
    aria-modal="true"
  >
    <div class="config-popup" on:click|stopPropagation role="document">
      <div class="config-field">
        <input
          id="table-label"
          type="text"
          bind:value={tempLabel}
          placeholder="Etiqueta"
        />
      </div>

      <div class="config-actions">
        <button
          on:click={() => setConfigTableType("6")}
          class:active={$tables.find((t) => t.id === configTableId)?.type ===
            "6"}
          title="6 Sillas"
        >
          6
        </button>
        <button
          on:click={() => setConfigTableType("8")}
          class:active={$tables.find((t) => t.id === configTableId)?.type ===
            "8"}
          title="8 Sillas"
        >
          8
        </button>
        <button on:click={rotateConfigTable} title="Girar 45°"> ↻ </button>
        <button on:click={saveTableConfig} class="save-btn" title="Guardar">
          ✓
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    background-color: #121212;
    display: flex;
    justify-content: center;
  }

  .app-container {
    width: 100%;
    min-width: 1600px;
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
    height: 10%;
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
    height: 180px;
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

  /* Configuration Popup */
  .config-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }

  .config-popup {
    background: rgba(44, 44, 44, 0.95);
    border-radius: 12px;
    padding: 20px;
    min-width: 280px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .config-field {
    margin-bottom: 12px;
  }

  .config-field input {
    width: 100%;
    padding: 10px 12px;
    background: rgba(30, 30, 30, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: white;
    font-size: 1rem;
  }

  .config-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .config-actions button {
    width: 50px;
    height: 50px;
    background: rgba(68, 68, 68, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.2rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .config-actions button:hover {
    background: rgba(85, 85, 85, 0.9);
    transform: scale(1.05);
  }

  .config-actions button.active {
    background: rgba(243, 129, 129, 0.9);
    border-color: #f38181;
  }

  .config-actions button.save-btn {
    background: rgba(76, 175, 80, 0.9);
    border-color: #4caf50;
  }

  .config-actions button.save-btn:hover {
    background: rgba(102, 187, 106, 0.9);
  }
</style>
