<script lang="ts">
    import { tables, djPosition, fotoBoxPosition } from "../lib/stores";
    import TableComponent from "./Table.svelte";
</script>

<div class="floor-plan-container">
    <div class="floor-plan">
        <!-- Room SVG Structure -->
        <svg
            class="room-structure"
            viewBox="0 0 1000 600"
            xmlns="http://www.w3.org/2000/svg"
        >
            <!-- Walls -->
            <defs>
                <pattern
                    id="hatch"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                >
                    <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="10"
                        style="stroke:#ccc; stroke-width:1"
                    />
                </pattern>
            </defs>

            <!-- Main Outer Walls -->
            <path
                d="M50,50 H450"
                stroke="black"
                stroke-width="8"
                stroke-linecap="round"
            />

            <!-- Top Wall Right (Split for Buffet opening) -->
            <path
                d="M550,50 H650"
                stroke="black"
                stroke-width="8"
                stroke-linecap="round"
            />
            <path
                d="M750,50 H950"
                stroke="black"
                stroke-width="8"
                stroke-linecap="round"
            />

            <!-- Top Wall Center Small Segment -->
            <path
                d="M580,50 H620"
                stroke="black"
                stroke-width="15"
                stroke-linecap="round"
            />

            <!-- Right Wall -->
            <path
                d="M950,50 V550"
                stroke="black"
                stroke-width="8"
                stroke-linecap="round"
            />

            <!-- Bottom Wall Right -->
            <path
                d="M950,550 H550"
                stroke="black"
                stroke-width="8"
                stroke-linecap="round"
            />
            <!-- Bottom Wall Left -->
            <path
                d="M450,550 H50"
                stroke="black"
                stroke-width="8"
                stroke-linecap="round"
            />

            <!-- Left Wall Bottom -->
            <path
                d="M50,550 V300"
                stroke="black"
                stroke-width="8"
                stroke-linecap="round"
            />
            <!-- Left Wall Top -->
            <path
                d="M50,200 V50"
                stroke="black"
                stroke-width="8"
                stroke-linecap="round"
            />

            <!-- Bar Area (Attached to Top Wall) -->
            <rect
                x="150"
                y="54"
                width="300"
                height="60"
                fill="#e0e0e0"
                stroke="#333"
                stroke-width="2"
            />
            <text
                x="300"
                y="90"
                font-family="Arial"
                font-size="20"
                text-anchor="middle"
                fill="#333">Bar</text
            >

            <!-- Pillar -->
            <circle cx="500" cy="400" r="15" fill="black" />

            <!-- Labels -->
            <text
                x="500"
                y="30"
                font-family="Arial"
                font-size="14"
                text-anchor="middle"
                fill="#333">GARDEROBE</text
            >
            <text
                x="700"
                y="30"
                font-family="Arial"
                font-size="14"
                text-anchor="middle"
                fill="#333">BUFFET</text
            >
            <text
                x="500"
                y="590"
                font-family="Arial"
                font-size="14"
                text-anchor="middle"
                fill="#333">WC</text
            >

            <!-- Arrows -->
            <!-- Top Wardrobe Arrow -->
            <g transform="translate(500, 70)">
                <path
                    d="M0,-25 V25 M-8,-15 L0,-25 L8,-15 M-8,15 L0,25 L8,15"
                    stroke="#f38181"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                />
            </g>
            <!-- Top Buffet Arrow -->
            <g transform="translate(700, 70)">
                <path
                    d="M0,-25 V25 M-8,-15 L0,-25 L8,-15 M-8,15 L0,25 L8,15"
                    stroke="#f38181"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                />
            </g>
            <!-- Bottom WC Arrow - CENTERED at 500 -->
            <g transform="translate(500, 530)">
                <path
                    d="M0,-25 V25 M-8,-15 L0,-25 L8,-15 M-8,15 L0,25 L8,15"
                    stroke="#f38181"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                />
            </g>
            <!-- Left Entrance Arrow -->
            <g transform="translate(70, 250) rotate(90)">
                <path
                    d="M0,-25 V25 M-8,-15 L0,-25 L8,-15 M-8,15 L0,25 L8,15"
                    stroke="#f38181"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                />
            </g>
        </svg>

        {#each $tables.filter((t) => t.placed) as table (table.id)}
            <TableComponent {table} />
        {/each}

        {#if $djPosition}
            <div
                class="extra-item dj"
                style="left: {$djPosition.x}px; top: {$djPosition.y}px"
            >
                🎧 DJ
            </div>
        {/if}

        {#if $fotoBoxPosition}
            <div
                class="extra-item fotobox"
                style="left: {$fotoBoxPosition.x}px; top: {$fotoBoxPosition.y}px"
            >
                📸 FotoBox
            </div>
        {/if}
    </div>
</div>

<style>
    .floor-plan-container {
        flex-grow: 1;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: auto;
        padding: 20px;
        position: relative;
    }

    .floor-plan {
        width: 1000px;
        height: 600px;
        background-color: #fff;
        position: relative;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
    }

    .room-structure {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
    }

    .extra-item {
        position: absolute;
        width: 100px;
        height: 60px;
        background: #3949ab;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        border: 2px solid #5c6bc0;
        font-weight: bold;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        user-select: none;
        z-index: 5;
    }

    .extra-item.fotobox {
        background: #00897b;
        border-color: #26a69a;
    }
</style>
