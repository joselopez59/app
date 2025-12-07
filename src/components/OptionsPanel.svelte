<script lang="ts">
    import { draggingItem } from "../lib/stores";

    function startDrag(e: MouseEvent, type: "dj" | "fotobox") {
        e.preventDefault();
        // Logic for dragging: we set the store, and App.svelte handles the movement overlay
        draggingItem.set({ type });
    }
</script>

<div class="options-panel-horizontal">
    <div class="option-item" on:mousedown={(e) => startDrag(e, "dj")}>
        <span class="icon">🎧</span>
        <span class="label">DJ Pult</span>
    </div>

    <div class="option-item" on:mousedown={(e) => startDrag(e, "fotobox")}>
        <span class="icon">📸</span>
        <span class="label">Fotobox</span>
    </div>
</div>

<style>
    .options-panel-horizontal {
        background: #1e1e1e;
        height: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 3rem;
        padding: 0 2rem;
        border-top: 1px solid #333;
        box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.2);
    }

    .option-item {
        background: #2c2c2c;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 0.5rem 1.5rem;
        cursor: grab;
        display: flex;
        align-items: center;
        gap: 0.8rem;
        transition:
            transform 0.2s,
            background-color 0.2s;
        user-select: none;
    }

    .option-item:hover {
        transform: translateY(-2px);
        background-color: #383838;
        border-color: #555;
    }

    .option-item:active {
        cursor: grabbing;
        transform: scale(0.98);
    }

    .icon {
        font-size: 1.5rem;
    }

    .label {
        color: #eee;
        font-weight: 500;
    }
</style>
