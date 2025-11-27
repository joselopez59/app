import { Table, Position } from '../types';

export class StorageService {
  private static TABLES_KEY = 'sala-tables';
  private static NEXT_ID_KEY = 'sala-next-id';
  private static DJ_POSITION_KEY = 'sala-dj-position';
  private static DJ_ROTATION_KEY = 'sala-dj-rotation';
  private static FOTOBOX_POSITION_KEY = 'sala-fotobox-position';

  static saveTables(tables: Table[], nextId: number): void {
    try {
      localStorage.setItem(this.TABLES_KEY, JSON.stringify(tables));
      localStorage.setItem(this.NEXT_ID_KEY, nextId.toString());
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
  }

  static loadTables(): { tables: Table[]; nextId: number } {
    try {
      const savedTables = localStorage.getItem(this.TABLES_KEY);
      const savedNextId = localStorage.getItem(this.NEXT_ID_KEY);

      let tables: Table[] = [];
      let nextId = 1;

      if (savedTables) {
        tables = JSON.parse(savedTables);
        // Asegurar que todas las mesas tengan el campo rotation
        tables.forEach(table => {
          if (table.rotation === undefined) {
            table.rotation = 0;
          }
        });
      }

      if (savedNextId) {
        nextId = parseInt(savedNextId, 10);
      }

      return { tables, nextId };
    } catch (e) {
      console.warn('No se pudo cargar de localStorage:', e);
      return { tables: [], nextId: 1 };
    }
  }

  static saveDraggablePositions(djPosition: Position, fotoBoxPosition: Position, djRotation?: number): void {
    try {
      localStorage.setItem(this.DJ_POSITION_KEY, JSON.stringify(djPosition));
      if (djRotation !== undefined) {
        localStorage.setItem(this.DJ_ROTATION_KEY, djRotation.toString());
      }
      localStorage.setItem(this.FOTOBOX_POSITION_KEY, JSON.stringify(fotoBoxPosition));
    } catch (e) {
      console.warn('No se pudo guardar posiciones en localStorage:', e);
    }
  }

  static loadDraggablePositions(): { djPosition: Position; fotoBoxPosition: Position; djRotation: number } {
    try {
      const savedDjPos = localStorage.getItem(this.DJ_POSITION_KEY);
      const savedDjRotation = localStorage.getItem(this.DJ_ROTATION_KEY);
      const savedFotoBoxPos = localStorage.getItem(this.FOTOBOX_POSITION_KEY);

      let djPosition: Position = { x: 900, y: 400 }; // Posición inicial en el bottom del floor-plan
      let djRotation: number = 0;
      let fotoBoxPosition: Position = { x: 400, y: 400 }; // Posición inicial en el bottom del floor-plan

      if (savedDjPos) {
        djPosition = JSON.parse(savedDjPos);
      }

      if (savedDjRotation) {
        djRotation = parseFloat(savedDjRotation);
      }

      if (savedFotoBoxPos) {
        fotoBoxPosition = JSON.parse(savedFotoBoxPos);
      }

      return { djPosition, fotoBoxPosition, djRotation };
    } catch (e) {
      console.warn('No se pudo cargar posiciones de localStorage:', e);
      return {
        djPosition: { x: 900, y: 400 }, // Posición inicial en el bottom del floor-plan
        fotoBoxPosition: { x: 400, y: 400 }, // Posición inicial en el bottom del floor-plan
        djRotation: 0
      };
    }
  }
}

