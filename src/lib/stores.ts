import { writable } from 'svelte/store';

export interface Table {
    id: number;
    x: number;
    y: number;
    type: '6' | '8';
    rotation: number;
    label: string;
    typeLocked: boolean;
    placed: boolean;
}

export interface DragItem {
    id?: number;
    type?: 'dj' | 'fotobox';
}

export const persons = writable<number>(40);

// Initialize tables with default staging tables
const initialTables: Table[] = [];
const defaultPersons = 40;
const neededTablesCount = Math.ceil(defaultPersons / 8);
for (let i = 0; i < neededTablesCount; i++) {
    initialTables.push({
        id: Date.now() + i,
        x: 0,
        y: 0,
        type: '8',
        rotation: 0,
        label: '',
        typeLocked: false,
        placed: false
    });
}

export const tables = writable<Table[]>(initialTables);

// Dragging state
export const draggingItem = writable<DragItem | null>(null);

// Positions for extra items
export const djPosition = writable<{ x: number, y: number } | null>(null);
export const fotoBoxPosition = writable<{ x: number, y: number } | null>(null);

// Table configuration constants
const TABLE_WIDTH = 140;
const TABLE_HEIGHT = 70;
const SEATS_PER_8 = 8;

export function updateStagingTables(targetPersons: number) {
    tables.update(currentTables => {
        // 1. Calculate current capacity of PLACED tables
        const placedTables = currentTables.filter(t => t.placed);
        const placedCapacity = placedTables.reduce((sum, t) => sum + (t.type === '8' ? 8 : 6), 0);

        // 2. Calculate needed capacity
        const neededCapacity = Math.max(0, targetPersons - placedCapacity);

        // 3. Keep existing unplaced tables, but adjust count
        // Note: For simplicity, we assume we fill gap with 8-seaters primarily
        const neededTablesCount = Math.ceil(neededCapacity / SEATS_PER_8);

        const stagingTables = currentTables.filter(t => !t.placed);

        if (stagingTables.length < neededTablesCount) {
            // Add tables
            const toAdd = neededTablesCount - stagingTables.length;
            for (let i = 0; i < toAdd; i++) {
                currentTables.push({
                    id: Date.now() + Math.random(), // Random to ensure uniqueness
                    x: 0,
                    y: 0,
                    type: '8',
                    rotation: 0,
                    label: '',
                    typeLocked: false,
                    placed: false
                });
            }
        } else if (stagingTables.length > neededTablesCount) {
            // Remove tables (from the end of unplaced list to avoid jitter?)
            // actually filter out the extras
            const toRemoveCount = stagingTables.length - neededTablesCount;
            // Identification of IDs to remove (LIFO)
            const idsToRemove = stagingTables.slice(stagingTables.length - toRemoveCount).map(t => t.id);
            currentTables = currentTables.filter(t => !idsToRemove.includes(t.id));
        }

        return currentTables;
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
