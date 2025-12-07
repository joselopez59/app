<script lang="ts">
    import Sidebar from "./components/Sidebar.svelte";
    import FloorPlan from "./components/FloorPlan.svelte";
    import {
        dragInfo,
        tables,
        djPosition,
        fotoBoxPosition,
    } from "./lib/stores";
    import { TableService } from "./services/TableService"; // Need to update service or move utils
    import { ROOM_WIDTH, ROOM_HEIGHT, ROOM_MARGIN } from "./types";

    function handleWindowMouseMove(e: MouseEvent) {
        if (!$dragInfo.isDragging) return;

        const { itemType, itemId, offset } = $dragInfo;
        // We need client rect of floor plan to calculate relative position
        const floorPlanEl = document.getElementById("floorPlan");
        if (!floorPlanEl) return;
        const rect = floorPlanEl.getBoundingClientRect();

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
    </div>
</div>

<style>
    /* Global styles imported in app.css */
</style>
