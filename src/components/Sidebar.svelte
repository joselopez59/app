<script lang="ts">
    import {
        tables,
        persons,
        updateStagingTables,
        draggingItem,
        djPosition,
        fotoBoxPosition,
        fotografPosition,
        geschenketischPosition,
        tischRoyalPosition,
        podiumPosition,
        tanzflachePosition,
    } from "../lib/stores";
    import Thumbwheel from "./Thumbwheel.svelte";
    import TableComponent from "./Table.svelte";

    // Staging tables: not yet placed
    $: stagingTables = $tables.filter((t) => !t.placed);

    // Initial load
    $: updateStagingTables($persons);

    function handleChange(val: number) {
        updateStagingTables(val);
    }

    function reset() {
        // Clear all placed tables - return them to staging area
        tables.update((curr) => curr.map((t) => ({ ...t, placed: false })));

        // Clear all item positions - return them to options panel
        djPosition.set(null);
        fotoBoxPosition.set(null);
        fotografPosition.set(null);
        geschenketischPosition.set(null);
        tischRoyalPosition.set(null);
        podiumPosition.set(null);
        tanzflachePosition.set(null);

        // Re-sync staging tables
        updateStagingTables($persons);
    }

    function handleStartDrag(e: MouseEvent, tableId: number) {
        if (e.button !== 0) return;
        draggingItem.set({ id: tableId });
    }
</script>

<div class="sidebar-container">
    <!-- Left: Thumbwheel -->
    <div class="thumbwheel-section">
        <Thumbwheel
            bind:value={$persons}
            on:change={(e) => handleChange(e.detail)}
        />
    </div>

    <!-- Center: Info & Reset -->
    <div class="info-section">
        <div class="table-count">
            {$tables.length} Tische
        </div>
        <button class="reset-btn" on:click={reset}> RESET </button>
    </div>

    <!-- Right: Staging Area Slider -->
    <div class="staging-area">
        {#each stagingTables as table (table.id)}
            <div
                class="staged-item"
                on:mousedown={(e) => handleStartDrag(e, table.id)}
            >
                <TableComponent {table} relative={true} />
            </div>
        {/each}
    </div>
</div>

<style>
    .sidebar-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        background-color: #fafafa; /* Light background */
        border-bottom: 1px solid #ddd;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        padding: 0 20px;
        gap: 20px;
    }

    .thumbwheel-section {
        flex-shrink: 0;
    }

    .info-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        min-width: 100px;
    }

    .table-count {
        font-size: 1.2rem;
        font-weight: bold;
        color: #333;
    }

    .reset-btn {
        background: #e53935;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 12px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1.1;
    }
    .reset-btn:hover {
        background: #d32f2f;
    }

    .staging-area {
        flex-grow: 1;
        height: 100%;
        display: flex;
        align-items: center;
        overflow-x: auto;
        gap: 15px;
        padding: 10px;
        background: #eee;
        border-radius: 8px;
        /* Inner shadow to indicate depth */
        box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .staged-item {
        flex-shrink: 0;
        transition: transform 0.2s;
    }
    .staged-item:hover {
        transform: translateY(-2px);
    }
</style>
