import { writable } from 'svelte/store';

export interface Table {
    id: number;
    x: number;
    y: number;
    type: '6' | '8';
    chairCount: number; // Actual number of chairs to display
    rotation: number;
    label: string;
    typeLocked: boolean;
    placed: boolean;
}

export interface DragItem {
    id?: number;
    type?: 'dj' | 'fotobox' | 'fotograf' | 'geschenketisch' | 'tischroyal' | 'podium' | 'tanzflache';
}

export const persons = writable<number>(40);

// Initialize tables with default staging tables
const initialTables: Table[] = [];
const defaultPersons = 40;
let remainingChairs = defaultPersons;
let tableIndex = 0;

while (remainingChairs > 0) {
    let chairCount = Math.min(remainingChairs, 6);
    if (remainingChairs >= 7) {
        chairCount = Math.min(remainingChairs, 8);
    }
    const tableType: '6' | '8' = chairCount >= 7 ? '8' : '6';

    initialTables.push({
        id: Date.now() + tableIndex,
        x: 0,
        y: 0,
        type: tableType,
        chairCount: chairCount,
        rotation: 0,
        label: '',
        typeLocked: false,
        placed: false
    });

    remainingChairs -= chairCount;
    tableIndex++;
}

export const tables = writable<Table[]>(initialTables);

// Dragging state
export const draggingItem = writable<DragItem | null>(null);

// Positions for extra items
export const djPosition = writable<{ x: number, y: number, rotation: number } | null>(null);
export const fotoBoxPosition = writable<{ x: number, y: number, rotation: number } | null>(null);
export const fotografPosition = writable<{ x: number, y: number, rotation: number } | null>(null);
export const geschenketischPosition = writable<{ x: number, y: number, rotation: number } | null>(null);
export const tischRoyalPosition = writable<{ x: number, y: number, rotation: number } | null>(null);
export const podiumPosition = writable<{ x: number, y: number, rotation: number } | null>(null);
export const tanzflachePosition = writable<{ x: number, y: number, rotation: number } | null>(null);

// Table configuration constants
const TABLE_WIDTH = 140;
const TABLE_HEIGHT = 70;
const SEATS_PER_8 = 8;

export function updateStagingTables(targetPersons: number) {
    tables.update(currentTables => {
        // 1. Calculate current capacity of PLACED tables
        const placedTables = currentTables.filter(t => t.placed);
        const placedCapacity = placedTables.reduce((sum, t) => sum + t.chairCount, 0);

        // 2. Calculate needed capacity
        const neededCapacity = Math.max(0, targetPersons - placedCapacity);

        // 3. Build new staging tables with dynamic chair counts
        const newStagingTables: Table[] = [];
        let remainingChairs = neededCapacity;
        let tableIndex = 0;

        while (remainingChairs > 0) {
            // Determine chair count for this table
            let chairCount = Math.min(remainingChairs, 6); // Start with up to 6 chairs

            // If we need 7 or more chairs, use type 8 table
            if (remainingChairs >= 7) {
                chairCount = Math.min(remainingChairs, 8);
            }

            // Determine table type based on chair count
            const tableType: '6' | '8' = chairCount >= 7 ? '8' : '6';

            newStagingTables.push({
                id: Date.now() + Math.random() + tableIndex,
                x: 0,
                y: 0,
                type: tableType,
                chairCount: chairCount,
                rotation: 0,
                label: '',
                typeLocked: false,
                placed: false
            });

            remainingChairs -= chairCount;
            tableIndex++;
        }

        // 4. Return placed tables + new staging tables
        return [...placedTables, ...newStagingTables];
    });
}

export function moveTable(id: number, dx: number, dy: number) {
    tables.update(current => {
        return current.map(t => {
            if (t.id === id) {
                return { ...t, x: t.x + dx, y: t.y + dy };
            }
            return t;
        });
    });
}
