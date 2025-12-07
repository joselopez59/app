<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let value = 40;
    export let min = 1;

    const dispatch = createEventDispatcher();
    let startY = 0;
    let startValue = 0;
    let isDragging = false;

    function handleMouseDown(e: MouseEvent) {
        isDragging = true;
        startY = e.clientY;
        startValue = value;
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isDragging) return;
        const dy = startY - e.clientY; // Drag up to increase
        const step = Math.floor(dy / 5); // Sensitivity
        let newValue = startValue + step;
        if (newValue < min) newValue = min;

        if (newValue !== value) {
            value = newValue;
            dispatch("input", value);
        }
    }

    function handleMouseUp() {
        isDragging = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    }

    function handleWheel(e: WheelEvent) {
        e.preventDefault();
        const delta = Math.sign(e.deltaY) * -1; // Scroll up to increase
        let newValue = value + delta;
        if (newValue < min) newValue = min;
        value = newValue;
        dispatch("input", value);
    }
</script>

<div
    class="thumbwheel-container"
    on:mousedown={handleMouseDown}
    on:wheel={handleWheel}
>
    <div class="wheel-display">
        <div class="highlight"></div>
        <div
            class="stripes"
            style="background-position-y: {value * 5}px;"
        ></div>
        <div class="value-overlay">{value}</div>
    </div>
    <div class="label">Anzahl Gäste</div>
</div>

<style>
    .thumbwheel-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        cursor: ns-resize;
        user-select: none;
    }

    .wheel-display {
        width: 80px;
        height: 50px;
        background: linear-gradient(to right, #222, #444, #222);
        border-radius: 4px;
        position: relative;
        overflow: hidden;
        box-shadow: inset 0 0 10px #000;
        border: 1px solid #555;
    }

    .stripes {
        position: absolute;
        top: -50px;
        left: 0;
        right: 0;
        bottom: -50px;
        background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 4px,
            rgba(255, 255, 255, 0.2) 5px
        );
        pointer-events: none;
        transition: background-position 0.1s linear;
    }

    .highlight {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 50%;
        background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.1),
            transparent
        );
        pointer-events: none;
    }

    .value-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 1.5rem;
        font-weight: bold;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        font-family: monospace;
    }

    .label {
        font-size: 0.8rem;
        color: #aaa;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
</style>
