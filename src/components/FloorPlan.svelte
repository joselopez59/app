<script lang="ts">
    import {
        tables,
        djPosition,
        fotoBoxPosition,
        fotografPosition,
        geschenketischPosition,
        tischRoyalPosition,
        podiumPosition,
        tanzflachePosition,
        draggingItem,
    } from "../lib/stores";
    import TableComponent from "./Table.svelte";

    export let scale = 1;
    export let onTableClick: ((id: number) => void) | undefined = undefined;

    let containerWidth = 1000;
    let containerHeight = 600;
    let showItemPopup = false;
    let configItemType:
        | "dj"
        | "fotobox"
        | "fotograf"
        | "geschenketisch"
        | "tischroyal"
        | "podium"
        | "tanzflache"
        | null = null;

    function openItemPopup(
        type:
            | "dj"
            | "fotobox"
            | "fotograf"
            | "geschenketisch"
            | "tischroyal"
            | "podium"
            | "tanzflache",
    ) {
        configItemType = type;
        showItemPopup = true;
    }

    function closeItemPopup() {
        showItemPopup = false;
        configItemType = null;
    }

    function rotateItem() {
        if (configItemType === "dj") {
            djPosition.update((pos) =>
                pos ? { ...pos, rotation: (pos.rotation + 45) % 360 } : null,
            );
        } else if (configItemType === "fotobox") {
            fotoBoxPosition.update((pos) =>
                pos ? { ...pos, rotation: (pos.rotation + 45) % 360 } : null,
            );
        } else if (configItemType === "fotograf") {
            fotografPosition.update((pos) =>
                pos ? { ...pos, rotation: (pos.rotation + 45) % 360 } : null,
            );
        } else if (configItemType === "geschenketisch") {
            geschenketischPosition.update((pos) =>
                pos ? { ...pos, rotation: (pos.rotation + 45) % 360 } : null,
            );
        } else if (configItemType === "tischroyal") {
            tischRoyalPosition.update((pos) =>
                pos ? { ...pos, rotation: (pos.rotation + 45) % 360 } : null,
            );
        } else if (configItemType === "podium") {
            podiumPosition.update((pos) =>
                pos ? { ...pos, rotation: (pos.rotation + 45) % 360 } : null,
            );
        } else if (configItemType === "tanzflache") {
            tanzflachePosition.update((pos) =>
                pos ? { ...pos, rotation: (pos.rotation + 45) % 360 } : null,
            );
        }
    }

    $: {
        const padding = 20;
        const availableWidth = containerWidth - padding;
        const availableHeight = containerHeight - padding;

        const scaleX = availableWidth / 1000;
        const scaleY = availableHeight / 600;

        scale = Math.min(scaleX, scaleY);
    }
</script>

<div
    class="floor-plan-container"
    bind:clientWidth={containerWidth}
    bind:clientHeight={containerHeight}
>
    <div
        class="floor-plan"
        style="transform: scale({scale}); transform-origin: center center;"
    >
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
            <TableComponent {table} {onTableClick} />
        {/each}

        {#if $djPosition}
            <div
                class="extra-item dj"
                style="left: {$djPosition.x}px; top: {$djPosition.y}px; transform: rotate({$djPosition.rotation}deg);"
                on:mousedown={(e) => {
                    if (e.button === 0) {
                        draggingItem.set({ type: "dj" });
                    }
                }}
                on:click={(e) => {
                    e.stopPropagation();
                    openItemPopup("dj");
                }}
                role="button"
                tabindex="0"
            >
                <div class="item-text">DJ Pult</div>
                <div class="item-icon">🎧</div>
            </div>
        {/if}

        {#if $fotoBoxPosition}
            <div
                class="extra-item fotobox"
                style="left: {$fotoBoxPosition.x}px; top: {$fotoBoxPosition.y}px; transform: rotate({$fotoBoxPosition.rotation}deg);"
                on:mousedown={(e) => {
                    if (e.button === 0) {
                        draggingItem.set({ type: "fotobox" });
                    }
                }}
                on:click={(e) => {
                    e.stopPropagation();
                    openItemPopup("fotobox");
                }}
                role="button"
                tabindex="0"
            >
                <div class="item-text">Fotobox</div>
                <div class="item-icon">📸</div>
            </div>
        {/if}

        {#if $fotografPosition}
            <div
                class="extra-item fotograf"
                style="left: {$fotografPosition.x}px; top: {$fotografPosition.y}px; transform: rotate({$fotografPosition.rotation}deg);"
                on:mousedown={(e) => {
                    if (e.button === 0) {
                        draggingItem.set({ type: "fotograf" });
                    }
                }}
                on:click={(e) => {
                    e.stopPropagation();
                    openItemPopup("fotograf");
                }}
                role="button"
                tabindex="0"
            >
                <div class="item-text">Fotograf</div>
                <div class="item-icon">🤳</div>
            </div>
        {/if}

        {#if $geschenketischPosition}
            <div
                class="extra-item geschenketisch"
                style="left: {$geschenketischPosition.x}px; top: {$geschenketischPosition.y}px; transform: rotate({$geschenketischPosition.rotation}deg);"
                on:mousedown={(e) => {
                    if (e.button === 0) {
                        draggingItem.set({ type: "geschenketisch" });
                    }
                }}
                on:click={(e) => {
                    e.stopPropagation();
                    openItemPopup("geschenketisch");
                }}
                role="button"
                tabindex="0"
            >
                <div class="item-text">Geschenketisch</div>
                <div class="item-icon">🎁</div>
            </div>
        {/if}

        {#if $tischRoyalPosition}
            <div
                class="extra-item tischroyal"
                style="left: {$tischRoyalPosition.x}px; top: {$tischRoyalPosition.y}px; transform: rotate({$tischRoyalPosition.rotation}deg);"
                on:mousedown={(e) => {
                    if (e.button === 0) {
                        draggingItem.set({ type: "tischroyal" });
                    }
                }}
                on:click={(e) => {
                    e.stopPropagation();
                    openItemPopup("tischroyal");
                }}
                role="button"
                tabindex="0"
            >
                <div class="item-text">Tisch Royal</div>
                <div class="item-icon">👑</div>
            </div>
        {/if}

        {#if $podiumPosition}
            <div
                class="extra-item podium"
                style="left: {$podiumPosition.x}px; top: {$podiumPosition.y}px; transform: rotate({$podiumPosition.rotation}deg);"
                on:mousedown={(e) => {
                    if (e.button === 0) {
                        draggingItem.set({ type: "podium" });
                    }
                }}
                on:click={(e) => {
                    e.stopPropagation();
                    openItemPopup("podium");
                }}
                role="button"
                tabindex="0"
            >
                <div class="item-text">Podium</div>
                <div class="item-icon">🎭</div>
            </div>
        {/if}

        {#if $tanzflachePosition}
            <div
                class="extra-item tanzflache"
                style="left: {$tanzflachePosition.x}px; top: {$tanzflachePosition.y}px; transform: rotate({$tanzflachePosition.rotation}deg);"
                on:mousedown={(e) => {
                    if (e.button === 0) {
                        draggingItem.set({ type: "tanzflache" });
                    }
                }}
                on:click={(e) => {
                    e.stopPropagation();
                    openItemPopup("tanzflache");
                }}
                role="button"
                tabindex="0"
            >
                <div class="item-text">Tanzfläche</div>
                <div class="item-icon">💃</div>
            </div>
        {/if}
    </div>
</div>

{#if showItemPopup}
    <div
        class="config-overlay"
        on:click={closeItemPopup}
        role="dialog"
        aria-modal="true"
    >
        <div class="config-popup" on:click|stopPropagation role="document">
            <h3>
                {configItemType === "dj"
                    ? "DJ Pult"
                    : configItemType === "fotobox"
                      ? "Fotobox"
                      : configItemType === "fotograf"
                        ? "Fotograf"
                        : configItemType === "geschenketisch"
                          ? "Geschenketisch"
                          : configItemType === "tischroyal"
                            ? "Tisch Royal"
                            : configItemType === "podium"
                              ? "Podium"
                              : configItemType === "tanzflache"
                                ? "Tanzfläche"
                                : ""}
            </h3>

            <div class="config-actions">
                {#if configItemType !== "fotograf"}
                    <button on:click={rotateItem} title="Girar 45°"> ↻ </button>
                {/if}
                <button
                    on:click={closeItemPopup}
                    class="save-btn"
                    title="Cerrar"
                >
                    ✓
                </button>
            </div>
        </div>
    </div>
{/if}

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
        background-image: linear-gradient(
                rgba(0, 0, 0, 0.05) 1px,
                transparent 1px
            ),
            linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
        background-size: 50px 50px;
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
        height: 80px;
        background: #3949ab;
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border-radius: 4px;
        border: 2px solid #5c6bc0;
        font-weight: bold;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        user-select: none;
        z-index: 5;
        cursor: grab;
    }

    .extra-item.fotobox {
        background: #00897b;
        border-color: #26a69a;
    }

    .extra-item.fotograf {
        background: #6a1b9a;
        border-color: #8e24aa;
    }

    .extra-item.geschenketisch {
        background: #c62828;
        border-color: #e53935;
    }

    .extra-item.tischroyal {
        background: #f57c00;
        border-color: #fb8c00;
    }

    .extra-item.podium {
        background: #7b1fa2;
        border-color: #9c27b0;
    }

    .extra-item.tanzflache {
        background: #0288d1;
        border-color: #03a9f4;
    }

    .item-text {
        font-size: 0.75rem;
        font-weight: 600;
    }

    .item-icon {
        font-size: 1.8rem;
    }

    /* Configuration Popup */
    .config-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }

    .config-popup {
        background: rgba(44, 44, 44, 0.95);
        border-radius: 12px;
        padding: 20px;
        min-width: 200px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .config-popup h3 {
        margin: 0 0 16px 0;
        color: #f38181;
        font-size: 1.2rem;
        text-align: center;
    }

    .config-actions {
        display: flex;
        gap: 8px;
        justify-content: center;
    }

    .config-actions button {
        width: 50px;
        height: 50px;
        background: rgba(68, 68, 68, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: white;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 1.2rem;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .config-actions button:hover {
        background: rgba(85, 85, 85, 0.9);
        transform: scale(1.05);
    }

    .config-actions button.save-btn {
        background: rgba(76, 175, 80, 0.9);
        border-color: #4caf50;
    }

    .config-actions button.save-btn:hover {
        background: rgba(102, 187, 106, 0.9);
    }
</style>
