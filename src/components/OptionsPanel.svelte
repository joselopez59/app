<script lang="ts">
    import {
        draggingItem,
        djPosition,
        fotoBoxPosition,
        fotografPosition,
        geschenketischPosition,
        tischRoyalPosition,
        podiumPosition,
        tanzflachePosition,
    } from "../lib/stores";

    function startDrag(
        e: MouseEvent,
        type:
            | "dj"
            | "fotobox"
            | "fotograf"
            | "geschenketisch"
            | "tischroyal"
            | "podium"
            | "tanzflache",
    ) {
        e.preventDefault();
        // Logic for dragging: we set the store, and App.svelte handles the movement overlay
        draggingItem.set({ type });
    }
</script>

<div class="options-panel-horizontal">
    {#if !$djPosition}
        <div
            class="option-item"
            on:mousedown={(e) => startDrag(e, "dj")}
            role="button"
            tabindex="0"
        >
            <span class="label">DJ Pult</span>
            <span class="icon">🎧</span>
        </div>
    {/if}

    {#if !$fotoBoxPosition}
        <div
            class="option-item"
            on:mousedown={(e) => startDrag(e, "fotobox")}
            role="button"
            tabindex="0"
        >
            <span class="label">Fotobox</span>
            <span class="icon">📸</span>
        </div>
    {/if}

    {#if !$fotografPosition}
        <div
            class="option-item"
            on:mousedown={(e) => startDrag(e, "fotograf")}
            role="button"
            tabindex="0"
        >
            <span class="label">Fotograf</span>
            <span class="icon">🤳</span>
        </div>
    {/if}

    {#if !$geschenketischPosition}
        <div
            class="option-item"
            on:mousedown={(e) => startDrag(e, "geschenketisch")}
            role="button"
            tabindex="0"
        >
            <span class="label">Geschenketisch</span>
            <span class="icon">🎁</span>
        </div>
    {/if}

    {#if !$tischRoyalPosition}
        <div
            class="option-item"
            on:mousedown={(e) => startDrag(e, "tischroyal")}
            role="button"
            tabindex="0"
        >
            <span class="label">Tisch Royal</span>
            <span class="icon">👑</span>
        </div>
    {/if}

    {#if !$podiumPosition}
        <div
            class="option-item"
            on:mousedown={(e) => startDrag(e, "podium")}
            role="button"
            tabindex="0"
        >
            <span class="label">Podium</span>
            <span class="icon">🎭</span>
        </div>
    {/if}

    {#if !$tanzflachePosition}
        <div
            class="option-item"
            on:mousedown={(e) => startDrag(e, "tanzflache")}
            role="button"
            tabindex="0"
        >
            <span class="label">Tanzfläche</span>
            <span class="icon">💃</span>
        </div>
    {/if}
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
        padding: 1rem 1.5rem;
        cursor: grab;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
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
        font-size: 2rem;
    }

    .label {
        color: #eee;
        font-weight: 500;
    }
</style>
