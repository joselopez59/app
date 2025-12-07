import { writable, type Writable } from 'svelte/store';
import { Table, Position, DraggedElement, DragOffset, ROOM_HEIGHT, ROOM_MARGIN } from '../types/index';
import { StorageService } from '../services/StorageService';

// Initial state
const savedPositions = StorageService.loadDraggablePositions();
const savedTables = StorageService.loadTables();

// Stores
export const tables: Writable<Table[]> = writable(savedTables);
export const selectedTables: Writable<string[]> = writable([]);

export const personas: Writable<number> = writable(40); // Default 40

export const djPosition: Writable<Position> = writable(savedPositions.djPosition);
export const djRotation: Writable<number> = writable(savedPositions.djRotation);
export const fotoBoxPosition: Writable<Position> = writable(savedPositions.fotoBoxPosition);

export const dragInfo: Writable<{
    itemType: 'table' | 'dj' | 'fotoBox' | null;
    itemId: string | null;
    offset: DragOffset;
    isDragging: boolean;
}> = writable({
    itemType: null,
    itemId: null,
    offset: { x: 0, y: 0 },
    isDragging: false
});

// Selection stores
export const selectionRect: Writable<{
    start: Position | null;
    end: Position | null;
    isSelecting: boolean;
}> = writable({
    start: null,
    end: null,
    isSelecting: false
});

// Actions
export const addTable = (seats: number = 8) => {
    tables.update(current => {
        // Implementation of add table logic will be moved here or in a service
        // For now, simpler store update
        return current;
    });
};
