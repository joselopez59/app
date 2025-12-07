export interface Table {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    seats: number;
    rotation: number;
    type: 'rect' | 'round'; // For future flexibility
}

export interface DragItem {
    type: 'table' | 'dj' | 'fotobox';
    id?: string; // If dragging an existing item
    offsetX?: number;
    offsetY?: number;
}
