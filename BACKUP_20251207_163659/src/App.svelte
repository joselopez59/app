<script lang="ts">
    import Sidebar from "./components/Sidebar.svelte";
    import FloorPlan from "./components/FloorPlan.svelte";
    import OptionsPanel from "./components/OptionsPanel.svelte";
    import {
        dragInfo,
        tables,
        djPosition,
        fotoBoxPosition,
    } from "./lib/stores";

    import { ROOM_WIDTH, ROOM_HEIGHT, ROOM_MARGIN } from "./types";

    function handleWindowMouseMove(e: MouseEvent) {
        if (!$dragInfo.isDragging) return;

        const { itemType, itemId, offset } = $dragInfo;
        // We need client rect of floor plan to calculate relative position
        const floorPlanEl = document.getElementById("floorPlan");
        if (!floorPlanEl) return;
        const rect = floorPlanEl.getBoundingClientRect();

        // Calculate relative to floor plan (even if mouse is outside, logic allows dragging back in)
        const x = e.clientX - rect.left - offset.x;
        const y = e.clientY - rect.top - offset.y;

        if (itemType === "table" && itemId) {
            tables.update((current) => {
                const t = current.find((t) => t.id === itemId);
                if (t) {
                    t.x = x;
                    t.y = y;
                }
                return [...current]; // Trigger update
            });
        } else if (itemType === "dj") {
            djPosition.set({ x, y });
        } else if (itemType === "fotoBox") {
            fotoBoxPosition.set({ x, y });
        }
    }

    function handleWindowMouseUp() {
        dragInfo.set({
            isDragging: false,
            itemType: null,
            itemId: null,
            offset: { x: 0, y: 0 },
        });
    }

    function handleOptionsDragStart(event: CustomEvent) {
        const { originalEvent, itemType, rect } = event.detail;
        const e = originalEvent as MouseEvent;

        // Calc offset from mouse to top-left of element
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        // Update Store
        dragInfo.set({
            isDragging: true,
            itemType: itemType,
            itemId: null,
            offset: { x: offsetX, y: offsetY },
        });

        // Snap to mouse pos immediately (effectively)
        // But we need to set initial position relative to floor plan
        // For a smooth experience, maybe we update position immediately?
        handleWindowMouseMove(e);
    }
</script>

<svelte:window
    on:mousemove={handleWindowMouseMove}
    on:mouseup={handleWindowMouseUp}
/>

<div class="app">
    <header class="app-header">
        <div class="header-content">
            <div class="logo-container" id="logoContainer">
                <svg
                    width="40"
                    height="40"
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle cx="20" cy="20" r="20" fill="#E60000" />
                    <path d="M10 20H30" stroke="white" stroke-width="4" />
                    <path d="M20 10V30" stroke="white" stroke-width="4" />
                </svg>
            </div>
            <h1>Tischordnung Saal A</h1>
        </div>
    </header>

    <div class="app-content">
        <Sidebar />
        <FloorPlan />
        <OptionsPanel on:sourceDragStart={handleOptionsDragStart} />
    </div>
</div>

<style>
    /* Global styles imported in app.css */
</style>
