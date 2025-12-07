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

export const persons = writable<number>(0);
export const tables = writable<Table[]>([]);

// Positions for extra items
export const djPosition = writable<{ x: number, y: number } | null>(null);
export const fotoBoxPosition = writable<{ x: number, y: number } | null>(null);

// Dragging state
export const draggingItem = writable<DragItem | null>(null);

// Table configuration constants
const TABLE_WIDTH = 140; // Reduced from 180
const TABLE_HEIGHT = 70; // Reduced from 80
const SEATS_PER_8 = 8;
// const SEATS_PER_6 = 6;

export function autoConfigureTables(count: number) {
    // Default strategy: Use 8-seat tables roughly
    const numTables = Math.ceil(count / SEATS_PER_8);
    const newTables: Table[] = [];

    const cols = 3;
    const startX = 100;
    const startY = 100;
    const gapX = 200;
    const gapY = 160;

    for (let i = 0; i < numTables; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        newTables.push({
            id: Date.now() + i,
            x: 0, // In staging, x/y ignored or relative
            y: 0,
            type: '8',
            rotation: 0,
            label: `Tisch ${i + 1}`,
            typeLocked: false,
            placed: false
        });
    }

    tables.set(newTables);
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
