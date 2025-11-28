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
  isLocked?: boolean; // Bloquear cambio automático de tipo y sillas
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

export const ROOM_WIDTH = 1000; // cm
export const ROOM_HEIGHT = 600; // cm (relación 100:60, 1000:600)
export const ROOM_MARGIN = 20; // cm
export const FOTOBOX_SIZE = 56; // px (30% más pequeño: 80 * 0.7)





