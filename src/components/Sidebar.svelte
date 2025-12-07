<script lang="ts">
    import { personas, tables } from "../lib/stores";
    import TableComponent from "./Table.svelte";
    import { Table, ROOM_HEIGHT } from "../types";

    // Simple ID generator if uuid not available
    const generateId = () => "table-" + Math.random().toString(36).substr(2, 9);

    function autoConfigureTables(totalPersonas: number) {
        if (isNaN(totalPersonas) || totalPersonas < 10) return;

        const validPersonas = Math.min(100, Math.max(10, totalPersonas));

        // Logic from app.ts
        let remainingPersonas = validPersonas;
        const tablesToCreate: number[] = [];

        const tables8 = Math.floor(remainingPersonas / 8);
        remainingPersonas = remainingPersonas % 8;
        for (let i = 0; i < tables8; i++) tablesToCreate.push(8);

        if (remainingPersonas > 0) {
            if (remainingPersonas === 7) tablesToCreate.push(7);
            else tablesToCreate.push(remainingPersonas);
        }

        // Limit to 13
        if (tablesToCreate.length > 13) {
            const excess = tablesToCreate.length - 13;
            for (let i = 0; i < excess; i++) tablesToCreate.pop();
            // Recalculate remaining
            const currentTotal = tablesToCreate.reduce((a, b) => a + b, 0);
            const diff = validPersonas - currentTotal;
            if (diff > 0 && tablesToCreate.length < 13)
                tablesToCreate.push(diff);
        }

        // Update Store
        tables.update((current) => {
            // Keep Geschenke
            const geschenke = current.find((t) => t.isGeschenke);
            const others = current.filter((t) => t.y < 500); // Keep tables already on floor?
            // Re-reading logic: logic replaces ALL tables except Geschenke.
            // AND it places them in the sidebar (y > ROOM_HEIGHT).

            const newTables: Table[] = [];
            if (geschenke) newTables.push(geschenke);

            let tableCount = 1;
            tablesToCreate.forEach((seats, index) => {
                // Check if we can reuse an existing table from the floor?
                // Orginal logic seemed to create new ones or reset.
                // We will create new ones for sidebar.
                newTables.push({
                    id: generateId(),
                    x: 0,
                    y: ROOM_HEIGHT + 50, // Sidebar area
                    seats: seats,
                    isRoyal: false,
                    isGeschenke: false,
                    tableNumber: tableCount++,
                    rotation: 0,
                });
            });

            return newTables;
        });
    }

    // React to personas change
    $: autoConfigureTables($personas);

    function handlePersonasChange(e: Event) {
        const val = parseInt((e.target as HTMLInputElement).value);
        personas.set(val);
    }

    function handleSidebarDragStart(event: CustomEvent) {
        // Logic to be handled up chain or via store
        // But typically we want to start drag immediately.
        // dispatch('sidebarDrag', event.detail);
    }

    // Filter for display
    $: sidebarTables = $tables.filter((t) => !t.isGeschenke && t.y >= 500);
</script>

<div class="table-list">
    <div class="personas-input-row">
        <div class="number-input-wrapper">
            <button
                class="number-input-btn"
                on:click={() => personas.update((n) => Math.max(10, n - 1))}
                >−</button
            >
            <input
                type="number"
                class="number-input"
                value={$personas}
                on:input={handlePersonasChange}
            />
            <button
                class="number-input-btn"
                on:click={() => personas.update((n) => Math.min(100, n + 1))}
                >+</button
            >
        </div>
    </div>

    <div class="calculated-tables-container">
        <!-- Render grid logic via CSS (flex wrap) -->
        <div
            style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;"
        >
            {#each sidebarTables as table (table.id)}
                <div style="margin: 5px;">
                    <TableComponent {table} isSidebar={true} on:sidebarDrag />
                </div>
            {/each}
        </div>
    </div>

    <button
        class="btn-clear-all"
        on:click={() => {
            /* Clear logic */
        }}>Alle Tische löschen</button
    >
</div>

<style>
    /* Reuse styles from global css */
</style>
