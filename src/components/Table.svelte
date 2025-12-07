<script lang="ts">
    import type { Table } from "../types";
    import { draggingItem } from "../lib/stores";

    export let table: Table;

    function handleMouseDown(e: MouseEvent) {
        if (e.button !== 0) return;
        e.preventDefault();
        draggingItem.set({ type: "table", id: table.id });
    }
</script>

<div
    class="table-rect"
    on:mousedown={handleMouseDown}
    style="
    left: {table.x}px; 
    top: {table.y}px; 
    width: {table.width}px; 
    height: {table.height}px;
    transform: rotate({table.rotation}deg);
  "
>
    <div class="table-surface">
        <span>Table</span>
    </div>

    <!-- Simple visual chairs representation -->
    <div class="chairs">
        {#each Array(table.seats) as _, i}
            <div class="chair" style="--i: {i}; --total: {table.seats}"></div>
        {/each}
    </div>
</div>

<style>
    .table-rect {
        position: absolute;
        /* transition: transform 0.1s; Optimize draggable later */
        cursor: grab;
        user-select: none;
    }

    .table-rect:active {
        cursor: grabbing;
    }

    .table-surface {
        width: 100%;
        height: 100%;
        background-color: #3e2723; /* Dark Wood */
        border: 2px solid #5d4037;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 2;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }

    span {
        font-size: 0.8rem;
        color: #d7ccc8;
    }

    .chairs {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }

    .chair {
        width: 20px;
        height: 20px;
        background: #5d4037;
        border-radius: 50%;
        position: absolute;
        /* Positioning logic for simple rect table needs math, 
       simplified here just to show existence */
        top: -10px;
        left: 50%;
    }

    /* Improved chair positioning for demo */
    .chair:nth-child(odd) {
        top: -15px;
    }
    .chair:nth-child(even) {
        bottom: -15px;
        top: auto;
    }
</style>
