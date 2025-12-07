<script lang="ts">
    import { draggingItem } from "../lib/stores";

    function startDrag(type: "dj" | "fotobox") {
        draggingItem.set({ type });
    }
</script>

<div class="options-panel">
    <h2>Optionen</h2>
    <div class="items-grid">
        <div
            class="draggable-item"
            on:mousedown={() => startDrag("dj")}
            role="button"
            tabindex="0"
        >
            🎧 DJ
        </div>
        <div
            class="draggable-item"
            on:mousedown={() => startDrag("fotobox")}
            role="button"
            tabindex="0"
        >
            📸 FotoBox
        </div>
    </div>
</div>

<style>
    .options-panel {
        background: #1e1e1e;
        color: #fff;
        padding: 1.5rem;
        height: 100%;
        border-left: 1px solid #333;
    }

    h2 {
        font-size: 1.5rem;
        margin: 0 0 1.5rem 0;
        color: var(--primary-color, #bb86fc);
    }

    .items-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: 1fr 1fr;
    }

    .draggable-item {
        aspect-ratio: 1;
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 8px;
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 0.5rem;
        font-size: 0.9rem;
        transition: all 0.2s;
    }

    .draggable-item:hover {
        border-color: var(--primary-color, #bb86fc);
        background: #333;
    }

    .draggable-item:active {
        cursor: grabbing;
    }
</style>
