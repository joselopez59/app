<script lang="ts">
    import { draggingItem, tables } from "../lib/stores";
    import type { Table } from "../lib/stores";

    export let table: Table;
    export let relative = false; // New prop for staging

    let showMenu = false;
    let menuX = 0;
    let menuY = 0;

    function handleMouseDown(e: MouseEvent) {
        if (e.button === 0) {
            // Left click
            // In staging, start "new" drag logic or just drag existing
            draggingItem.set({ id: table.id });
        }
    }

    function handleContextMenu(e: MouseEvent) {
        if (relative) return; // No context menu in staging
        e.preventDefault();
        e.stopPropagation();
        showMenu = true;
        menuX = e.clientX;
        menuY = e.clientY;
    }

    // Handle menu actions
    function setType(type: "6" | "8") {
        if (table.typeLocked) return;
        updateTable({ ...table, type });
        showMenu = false;
    }

    function toggleLock() {
        updateTable({ ...table, typeLocked: !table.typeLocked });
        showMenu = false;
    }

    function rotate() {
        const newRot = (table.rotation + 90) % 360;
        updateTable({ ...table, rotation: newRot });
    }

    function rename() {
        const newName = prompt("Nombre mesa:", table.label);
        if (newName !== null) updateTable({ ...table, label: newName });
        showMenu = false;
    }

    function updateTable(newTable: Table) {
        tables.update((curr) =>
            curr.map((t) => (t.id === table.id ? newTable : t)),
        );
    }

    function closeMenu() {
        showMenu = false;
    }
</script>

<svelte:window on:click={closeMenu} />

<div
    class="table-wrapper"
    class:relative
    style={relative ? "" : `left: ${table.x}px; top: ${table.y}px;`}
    on:mousedown={handleMouseDown}
    on:contextmenu={handleContextMenu}
    role="button"
    tabindex="0"
>
    <!-- Label -->
    <div class="table-label">{table.label}</div>

    <!-- Rotated Container -->
    <div class="table-body" style="transform: rotate({table.rotation}deg);">
        <!-- Table Top -->
        <div class="table-surface type-{table.type}">
            <!-- Chairs Generation -->
            {#if table.type === "8"}
                <!-- 3 Top, 3 Bottom, 1 Left, 1 Right -->
                <div class="chairs-row top">
                    <div class="chair"></div>
                    <div class="chair"></div>
                    <div class="chair"></div>
                </div>
                <div class="chairs-row bottom">
                    <div class="chair"></div>
                    <div class="chair"></div>
                    <div class="chair"></div>
                </div>
                <div class="chair-side left"></div>
                <div class="chair-side right"></div>
            {:else}
                <!-- Type 6: 2 Top, 2 Bottom, 1 Left, 1 Right -->
                <div class="chairs-row top justify-center">
                    <div class="chair"></div>
                    <div class="chair"></div>
                </div>
                <div class="chairs-row bottom justify-center">
                    <div class="chair"></div>
                    <div class="chair"></div>
                </div>
                <div class="chair-side left"></div>
                <div class="chair-side right"></div>
            {/if}
        </div>
    </div>
</div>

{#if showMenu}
    <div
        class="context-menu"
        style="left: {menuX}px; top: {menuY}px;"
        on:click|stopPropagation
    >
        <div class="menu-header">{table.label}</div>
        <button
            on:click={() => setType("6")}
            disabled={table.typeLocked}
            class:active={table.type === "6"}>6 Sillas</button
        >
        <button
            on:click={() => setType("8")}
            disabled={table.typeLocked}
            class:active={table.type === "8"}>8 Sillas</button
        >
        <div class="divider"></div>
        <button on:click={rotate}>Girar 90°</button>
        <button on:click={toggleLock}
            >{table.typeLocked ? "Desbloquear" : "Bloquear Tipo"}</button
        >
        <button on:click={rename}>Renombrar</button>
    </div>
{/if}

<style>
    .table-wrapper {
        position: absolute;
        cursor: grab;
        user-select: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 10;
    }

    .table-wrapper.relative {
        position: relative;
        left: auto !important;
        top: auto !important;
        margin: 0 10px;
        transform: scale(0.8); /* Smaller in sidebar */
    }

    .table-wrapper:active {
        cursor: grabbing;
    }

    .table-label {
        background: rgba(0, 0, 0, 0.6);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 1rem;
        margin-bottom: 8px;
        white-space: nowrap;
        text-shadow: 0 1px 2px black;
        pointer-events: none;
    }

    .table-body {
        transition: transform 0.2s ease-out;
    }

    .table-surface {
        /* Reduced size as requested */
        width: 140px;
        height: 70px;
        background-color: #5d4037;
        border: 2px solid #3e2723;
        border-radius: 6px;
        position: relative;
        box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Chair Styles - Slightly larger */
    .chair,
    .chair-side {
        width: 24px;
        height: 24px;
        background-color: #8d6e63;
        border: 1px solid #4e342e;
        border-radius: 50%; /* Round chairs */
        position: absolute;
        box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
    }

    /* Chair Positioning */
    .chairs-row {
        position: absolute;
        width: 100%;
        display: flex;
        padding: 0 10px;
        box-sizing: border-box;
        justify-content: space-between;
    }

    .chairs-row.justify-center {
        justify-content: space-around;
        padding: 0 20px;
    }

    .chairs-row.top {
        top: -20px;
    }
    .chairs-row.bottom {
        bottom: -20px;
    }

    .chair-side {
        top: 50%;
        transform: translateY(-50%);
    }
    .chair-side.left {
        left: -20px;
    }
    .chair-side.right {
        right: -20px;
    }

    /* Context Menu */
    .context-menu {
        position: fixed;
        background: #2c2c2c;
        color: white;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 140px;
        z-index: 9999;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
    }

    .context-menu button {
        background: none;
        border: none;
        color: #eee;
        text-align: left;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 0.9rem;
        border-radius: 4px;
        transition: background 0.1s;
    }
    .context-menu button:hover {
        background: #444;
    }
    .context-menu button.active {
        background: #d83d3d;
        color: #fff;
    }
    .context-menu button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .menu-header {
        font-weight: bold;
        padding: 4px 12px;
        color: #aaa;
        font-size: 0.8rem;
        text-transform: uppercase;
    }

    .divider {
        height: 1px;
        background: #444;
        margin: 4px 0;
    }
</style>
