<script lang="ts">
    import { persons, autoConfigureTables, tables } from "../lib/stores";

    let localPersons = $persons;

    // React to changes in local input
    function handleInput() {
        persons.set(localPersons);
        autoConfigureTables(localPersons);
    }

    function handleReset() {
        localPersons = 0;
        persons.set(0);
        tables.set([]);
    }
</script>

<div class="sidebar">
    <h2>Settings</h2>

    <div class="control-group">
        <label for="persons-input">Number of Persons</label>
        <input
            id="persons-input"
            type="number"
            min="0"
            bind:value={localPersons}
            on:input={handleInput}
            placeholder="e.g. 100"
        />
    </div>

    <div class="info">
        <p>Tables: {$tables.length}</p>
    </div>

    <div class="actions">
        <button class="danger" on:click={handleReset}>Clear All</button>
    </div>
</div>

<style>
    .sidebar {
        background: var(--bg-panel);
        color: #fff;
        padding: 1.5rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        border-right: 1px solid var(--border-color);
    }

    h2 {
        font-size: 1.5rem;
        margin: 0;
        color: var(--primary-color);
    }

    .control-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    label {
        font-size: 0.9rem;
        color: #aaa;
    }

    input {
        padding: 0.8rem;
        background: #121212;
        border: 1px solid #444;
        color: #fff;
        border-radius: 6px;
        font-size: 1rem;
    }

    input:focus {
        outline: none;
        border-color: var(--primary-color);
    }

    .info {
        font-size: 0.9rem;
        color: #888;
        padding: 1rem;
        background: #1a1a1a; /* slightly darker */
        border-radius: 6px;
    }

    .actions {
        margin-top: auto;
    }

    button.danger {
        background-color: #cf6679;
        width: 100%;
        color: #000;
    }
</style>
