<script lang="ts">
    export let type: "dj" | "fotoBox";
    export let x: number;
    export let y: number;
</script>

<div
    class="draggable-item {type}"
    style="left: {x}px; top: {y}px; position: absolute;"
>
    <!-- Content -->
</div>
