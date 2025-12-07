export interface Position {
    x: number;
    y: number;
}

export interface Table {
    id: string;
    x: number;
    y: number;
    seats: number;
    isRoyal: boolean;
    isGeschenke: boolean;
    tableNumber: number | string;
    rotation: number;
}

export interface DragOffset {
    x: number;
    y: number;
}

export type DraggedElement = 'dj' | 'fotoBox' | null;

export interface TableDimensions {
    tableWidth: number;
    tableHeight: number;
    containerWidth: number;
    containerHeight: number;
}

// Constants
export const ROOM_WIDTH = 1000;
export const ROOM_HEIGHT = 600;
export const ROOM_MARGIN = 20;
export const FOTOBOX_SIZE = 56;
