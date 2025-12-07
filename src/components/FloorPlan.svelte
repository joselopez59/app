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
        <svg class="floor-plan-svg" viewBox="0 0 1000 500">
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
            <rect width="1000" height="500" fill="url(#tilePattern)"></rect>
            <!-- Walls and other static SVG elements from index.html -->
            <rect x="0" y="0" width="1000" height="20" fill="#999999"></rect>
            <rect x="0" y="0" width="20" height="500" fill="#999999"></rect>
            <rect x="980" y="0" width="20" height="500" fill="#999999"></rect>
            <rect x="0" y="480" width="1000" height="20" fill="#999999"></rect>

            <!-- Openings -->
            <rect x="410" y="0" width="180" height="22" fill="url(#tilePattern)"
            ></rect>
            <rect x="0" y="175" width="22" height="150" fill="url(#tilePattern)"
            ></rect>
            <rect
                x="450"
                y="480"
                width="100"
                height="22"
                fill="url(#tilePattern)"
            ></rect>

            <!-- Bar -->
            <rect x="585" y="0" width="415" height="100" fill="#808080"></rect>
            <text
                x="792"
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
            <g
                id="djMixer"
                transform="translate({$djPosition.x - 900}, {$djPosition.y -
                    400}) rotate({$djRotation}, {$djPosition.x}, {$djPosition.y})"
            >
                <!-- DJ SVG Content -->
                <rect width="140" height="60" fill="#333"></rect>
            </g>
        </svg>

        {#each $tables as table (table.id)}
            {#if !table.isGeschenke && table.y < 500}
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
