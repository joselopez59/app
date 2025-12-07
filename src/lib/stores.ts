import { writable } from 'svelte/store';
import type { Table, DragItem } from '../types';

export const persons = writable<number>(0);
export const tables = writable<Table[]>([]);

// Positions for extra items
export const djPosition = writable<{ x: number, y: number } | null>(null);
export const fotoBoxPosition = writable<{ x: number, y: number } | null>(null);

// Dragging state
export const draggingItem = writable<DragItem | null>(null);

// Logic to auto-configure tables
const TABLE_WIDTH = 180; // Example dimensions
const TABLE_HEIGHT = 80;
const SEATS_PER_TABLE = 8; // Example

export function autoConfigureTables(count: number) {
    const numTables = Math.ceil(count / SEATS_PER_TABLE);
    const newTables: Table[] = [];

    // Simple grid layout logic
    const cols = 3;
    const startX = 50;
    const startY = 50;
    const gapX = 200;
    const gapY = 150;

    for (let i = 0; i < numTables; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        newTables.push({
            id: crypto.randomUUID(),
            x: startX + col * gapX,
            y: startY + row * gapY,
            width: TABLE_WIDTH,
            height: TABLE_HEIGHT,
            seats: SEATS_PER_TABLE, // Simplified for now
            rotation: 0,
            type: 'rect'
        });
    }

    tables.set(newTables);
}

export function moveTable(id: string, dx: number, dy: number) {
    tables.update(current => {
        return current.map(t => {
            if (t.id === id) {
                return { ...t, x: t.x + dx, y: t.y + dy };
            }
            return t;
        });
    });
}
