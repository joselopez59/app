<script lang="ts">
    import {
        tables,
        selectedTables,
        selectionRect,
        dragInfo,
        djPosition,
        djRotation,
        fotoBoxPosition,
    } from "../lib/stores";
    import TableComponent from "./Table.svelte";
    import DraggableItem from "./DraggableItem.svelte";
    import { onMount } from "svelte";
    import { Table } from "../types";

    let floorPlanEl: HTMLElement;

    function handleTableDown(event: CustomEvent) {
        const { originalEvent, table } = event.detail;
        // Start drag logic update store
    }

    function handleMouseMove(e: MouseEvent) {
        // Global drag logic (could be here or on window)
    }

    function handleMouseUp() {
        // Global drag end
    }
</script>

<div class="floor-plan-container">
    <div class="floor-plan" id="floorPlan" bind:this={floorPlanEl}>
        <svg class="floor-plan-svg" viewBox="0 0 1000 600">
            <defs>
                <pattern
                    id="tilePattern"
                    patternUnits="userSpaceOnUse"
                    width="20"
                    height="20"
                >
                    <rect width="20" height="20" fill="#f0f0f0"></rect>
                    <rect width="18" height="18" fill="#e0e0e0" x="1" y="1"
                    ></rect>
                </pattern>
            </defs>
            <rect width="1000" height="600" fill="url(#tilePattern)"></rect>
            <!-- Walls and other static SVG elements from index.html -->
            <rect x="0" y="0" width="1000" height="20" fill="#999999"></rect>
            <rect x="0" y="0" width="20" height="600" fill="#999999"></rect>
            <rect x="980" y="0" width="20" height="600" fill="#999999"></rect>
            <rect x="0" y="580" width="1000" height="20" fill="#999999"></rect>

            <!-- Openings -->
            <rect x="410" y="0" width="180" height="22" fill="url(#tilePattern)"
            ></rect>
            <rect x="0" y="175" width="22" height="150" fill="url(#tilePattern)"
            ></rect>
            <rect
                x="450"
                y="580"
                width="100"
                height="22"
                fill="url(#tilePattern)"
            ></rect>

            <!-- Bar (x=220: 20px wall + 200px margin) -->
            <rect x="220" y="0" width="415" height="100" fill="#808080"></rect>
            <text
                x="427"
                y="50"
                font-family="Arial"
                font-size="20"
                fill="white"
                text-anchor="middle"
                dominant-baseline="middle">Bar</text
            >

            <!-- Column -->
            <circle cx="500" cy="250" r="20" fill="#999999"></circle>

            <!-- Render DJ via Component or direct SVG if simpler -->
            <!-- Calculate transform outside to avoid template syntax issues -->
            {@const djX = $djPosition.x}
            {@const djY = $djPosition.y}
            {@const djRot = $djRotation}
            <g
                id="djMixer"
                transform="translate({djX - 900}, {djY -
                    400}) rotate({djRot}, {djX}, {djY})"
            >
                <!-- DJ SVG Content -->
                <rect width="140" height="60" fill="#333"></rect>
            </g>
        </svg>

        {#each $tables as table (table.id)}
            {#if !table.isGeschenke && table.y < 600}
                <!-- Render only if on floor plan (simplification) -->
                <TableComponent
                    {table}
                    isSelected={$selectedTables.includes(table.id)}
                    on:startDrag={handleTableDown}
                />
            {/if}
        {/each}

        <!-- Render Geschenke and FotoBox -->
    </div>
</div>
