<script lang="ts">
    import { tables, djPosition, fotoBoxPosition } from "../lib/stores";
    import TableComponent from "./Table.svelte";
</script>

<div class="floor-plan-container">
    <div class="floor-plan">
        <!-- Grid -->

        {#each $tables as table (table.id)}
            <TableComponent {table} />
        {/each}

        {#if $djPosition}
            <div
                class="extra-item dj"
                style="left: {$djPosition.x}px; top: {$djPosition.y}px"
            >
                🎧 DJ
            </div>
        {/if}

        {#if $fotoBoxPosition}
            <div
                class="extra-item fotobox"
                style="left: {$fotoBoxPosition.x}px; top: {$fotoBoxPosition.y}px"
            >
                📸 FotoBox
            </div>
        {/if}

        <div class="wall-label origin">0,0</div>
    </div>
</div>

<style>
    .floor-plan-container {
        flex-grow: 1;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: auto;
        padding: 50px;
        position: relative;
    }

    .floor-plan {
        width: 1000px;
        height: 600px;
        background: #2a2a2a;
        border: 4px solid #444;
        position: relative;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
        background-image: radial-gradient(#333 1px, transparent 1px);
        background-size: 20px 20px;
    }

    .wall-label {
        position: absolute;
        color: #555;
        font-size: 0.7rem;
        pointer-events: none;
    }
    .origin {
        top: 5px;
        left: 5px;
    }

    .extra-item {
        position: absolute;
        width: 100px;
        height: 60px;
        background: #3949ab;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        border: 2px solid #5c6bc0;
        font-weight: bold;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        user-select: none;
        z-index: 5;
    }

    .extra-item.fotobox {
        background: #00897b;
        border-color: #26a69a;
    }
</style>
