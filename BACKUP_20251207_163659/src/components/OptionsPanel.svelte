<script lang="ts">
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    function handleDragStart(event: MouseEvent, type: "dj" | "fotoBox") {
        event.preventDefault();
        // Dispatch event to parent (App.svelte) or update store directly
        // Consistent with Sidebar logic, we can emit an event or better yet, using the store directly
        // But for DraggableItem component behavior, we need to know where it is starting.
        // Let's use a custom event for "startDragFromSource" logic similar to Sidebar.

        const target = event.target as HTMLElement;
        const rect = target.getBoundingClientRect();

        dispatch("sourceDragStart", {
            originalEvent: event,
            itemType: type,
            rect: rect,
        });
    }
</script>

<div class="options-panel">
    <h2>Optionen</h2>

    <div class="option-group">
        <h3>DJ Pult</h3>
        <div
            class="draggable-source-item dj-source"
            on:mousedown={(e) => handleDragStart(e, "dj")}
        >
            <!-- Simple SVG preview -->
            <svg width="100" height="40" viewBox="0 0 140 60">
                <rect width="140" height="60" fill="#333"></rect>
                <line
                    x1="10"
                    y1="10"
                    x2="130"
                    y2="50"
                    stroke="#666"
                    stroke-width="2"
                ></line>
                <line
                    x1="10"
                    y1="50"
                    x2="130"
                    y2="10"
                    stroke="#666"
                    stroke-width="2"
                ></line>
                <circle cx="35" cy="30" r="15" fill="#ddd"></circle>
                <circle cx="105" cy="30" r="15" fill="#ddd"></circle>
            </svg>
        </div>
    </div>

    <div class="option-group">
        <h3>FotoBox</h3>
        <div
            class="draggable-source-item fotobox-source"
            on:mousedown={(e) => handleDragStart(e, "fotoBox")}
        >
            <div class="fotobox-preview">
                <div>Foto</div>
                <div>Box</div>
            </div>
        </div>
    </div>
</div>

<style>
    .options-panel {
        background-color: #2a2a2a;
        padding: 20px;
        color: #dcb15a;
        border-left: 2px solid #555;
        display: flex;
        flex-direction: column;
        gap: 30px;
        width: 250px; /* Fixed width for right panel */
    }

    h2 {
        margin-top: 0;
        border-bottom: 2px solid #dcb15a;
        padding-bottom: 10px;
        color: #fff;
    }

    h3 {
        color: #dcb15a;
        margin-bottom: 10px;
    }

    .draggable-source-item {
        cursor: pointer;
        transition: transform 0.2s;
        border: 1px dashed #dcb15a;
        padding: 10px;
        display: flex;
        justify-content: center;
    }

    .draggable-source-item:hover {
        transform: scale(1.05);
        background: rgba(220, 177, 90, 0.1);
    }

    .fotobox-preview {
        width: 56px;
        height: 56px;
        background: #d0d0d0;
        border: 2px solid #999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        color: #666;
        font-weight: bold;
        font-size: 10px;
        line-height: 1;
    }
</style>
