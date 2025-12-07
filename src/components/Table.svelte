<script lang="ts">
    import { Table } from "../types/index";
    import { createEventDispatcher, onMount } from "svelte";

    export let table: Table;
    export let isSelected: boolean = false;
    export let isSidebar: boolean = false;

    const dispatch = createEventDispatcher();

    // Constants to match original logic
    const tableWidth = 60;
    const tableHeight = 60;
    const chairDistance = 4;
    const chairSize = 12;

    // Reactive chair positions
    let chairs: { left: number; top: number }[] = [];

    $: {
        chairs = calculateChairPositions(table.seats);
    }

    function handleMouseDown(event: MouseEvent) {
        if (isSidebar) {
            dispatch("sidebarDrag", { originalEvent: event, table });
        } else {
            dispatch("startDrag", { originalEvent: event, table });
        }
    }

    function handleRotate() {
        dispatch("rotate", table.id);
    }

    function calculateChairPositions(totalSeats: number) {
        if (table.isGeschenke || table.isRoyal) return [];

        let seatsTop = 0,
            seatsBottom = 0,
            seatsRight = 0,
            seatsLeft = 0;

        // Distribution logic (copied from app.ts)
        if (totalSeats === 8) {
            seatsTop = 3;
            seatsBottom = 3;
            seatsRight = 1;
            seatsLeft = 1;
        } else if (totalSeats === 7) {
            seatsTop = 3;
            seatsBottom = 3;
            seatsRight = 1;
            seatsLeft = 0;
        } else if (totalSeats <= 6) {
            if (totalSeats <= 2) {
                seatsTop = totalSeats;
            } else if (totalSeats <= 4) {
                seatsTop = Math.ceil(totalSeats / 2);
                seatsBottom = totalSeats - seatsTop;
            } else {
                seatsTop = 2;
                seatsBottom = 2;
                const remaining = totalSeats - 4;
                seatsRight = Math.ceil(remaining / 2);
                seatsLeft = remaining - seatsRight;
            }
        } else {
            seatsTop = Math.ceil(totalSeats / 4);
            seatsBottom = Math.ceil(totalSeats / 4);
            const remaining = totalSeats - seatsTop - seatsBottom;
            seatsRight = Math.ceil(remaining / 2);
            seatsLeft = remaining - seatsRight;

            // Balancing logic
            const currentTotal =
                seatsTop + seatsBottom + seatsRight + seatsLeft;
            if (currentTotal < totalSeats) {
                seatsTop += totalSeats - currentTotal;
            } else if (currentTotal > totalSeats) {
                seatsTop = Math.max(0, seatsTop - (currentTotal - totalSeats));
            }
        }

        const containerWidth = tableWidth + chairSize * 2 + chairDistance * 2;
        const containerHeight = tableHeight + chairSize * 2 + chairDistance * 2;
        const containerCenterX = containerWidth / 2;
        const containerCenterY = containerHeight / 2;

        const positions: { left: number; top: number }[] = [];

        // Top
        for (let i = 0; i < seatsTop; i++) {
            const offset =
                seatsTop > 1
                    ? (i + 1) * (tableWidth / (seatsTop + 1)) - tableWidth / 2
                    : 0;
            positions.push({
                left: containerCenterX + offset - chairSize / 2,
                top:
                    containerCenterY -
                    tableHeight / 2 -
                    chairDistance -
                    chairSize / 2,
            });
        }
        // Right
        for (let i = 0; i < seatsRight; i++) {
            const offset =
                seatsRight > 1
                    ? (i + 1) * (tableHeight / (seatsRight + 1)) -
                      tableHeight / 2
                    : 0;
            positions.push({
                left:
                    containerCenterX +
                    tableWidth / 2 +
                    chairDistance -
                    chairSize / 2,
                top: containerCenterY + offset - chairSize / 2,
            });
        }
        // Bottom
        for (let i = 0; i < seatsBottom; i++) {
            const offset =
                seatsBottom > 1
                    ? (i + 1) * (tableWidth / (seatsBottom + 1)) -
                      tableWidth / 2
                    : 0;
            positions.push({
                left: containerCenterX - offset - chairSize / 2,
                top:
                    containerCenterY +
                    tableHeight / 2 +
                    chairDistance -
                    chairSize / 2,
            });
        }
        // Left
        for (let i = 0; i < seatsLeft; i++) {
            const offset =
                seatsLeft > 1
                    ? (i + 1) * (tableHeight / (seatsLeft + 1)) -
                      tableHeight / 2
                    : 0;
            positions.push({
                left:
                    containerCenterX -
                    tableWidth / 2 -
                    chairDistance -
                    chairSize / 2,
                top: containerCenterY + offset - chairSize / 2,
            });
        }

        return positions;
    }
</script>

<div
    class="table {isSidebar ? 'table-sidebar' : ''} {isSelected
        ? 'selected'
        : ''}"
    style={isSidebar
        ? ""
        : `transform: translate(${table.x}px, ${table.y}px); top:0; left:0; position:absolute;`}
    data-id={table.id}
    on:mousedown={handleMouseDown}
    role="button"
    tabindex="0"
>
    <div
        class="table-container"
        style="width: {tableWidth + 40}px; height: {tableHeight + 40}px;"
    >
        <!-- Approx dimensions including chairs -->
        <div class="chairs-container">
            {#each chairs as chair}
                <div
                    class="chair"
                    style="left: {chair.left}px; top: {chair.top}px;"
                ></div>
            {/each}
        </div>
        <div
            class="table-circle"
            style="width: {tableWidth}px; height: {tableHeight}px;"
        >
            <div class="table-seats">
                {#if table.isGeschenke}
                    Geschenke
                {:else if table.isRoyal}
                    R
                {:else}
                    {table.tableNumber}
                {/if}
            </div>
        </div>
    </div>

    {#if isSelected && !isSidebar}
        <div class="rotation-controls">
            <button
                class="table-control-btn rotate-btn"
                on:click|stopPropagation={handleRotate}>↻</button
            >
            <!-- Add other buttons as needed -->
        </div>
    {/if}
</div>
