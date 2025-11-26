import { Table, TableDimensions, ROOM_WIDTH, ROOM_HEIGHT, ROOM_MARGIN } from '../types';
import { StorageService } from './StorageService';

export class TableService {
  private tables: Table[] = [];
  private nextTableId: number = 1;
  private onTablesChange: () => void;

  constructor(onTablesChange: () => void) {
    this.onTablesChange = onTablesChange;
    this.loadTables();
  }

  loadTables(): void {
    const { tables, nextId } = StorageService.loadTables();
    this.tables = tables;
    this.nextTableId = nextId;
  }

  saveTables(): void {
    StorageService.saveTables(this.tables, this.nextTableId);
  }

  getTables(): Table[] {
    return this.tables;
  }

  addTable(seats: number, isRoyal: boolean = false): void {
    let x: number, y: number;

    if (isRoyal) {
      x = 900;
      y = 250;
    } else {
      x = 500;
      y = 250;
    }

    const newTable: Table = {
      id: `table-${this.nextTableId}`,
      x,
      y,
      seats,
      isRoyal,
      isGeschenke: false,
      tableNumber: this.nextTableId,
      rotation: 0
    };

    this.tables.push(newTable);
    this.nextTableId++;
    this.saveTables();
    this.onTablesChange();
  }

  deleteTable(id: string): void {
    this.tables = this.tables.filter(table => table.id !== id);
    this.saveTables();
    this.onTablesChange();
  }

  clearAllTables(): boolean {
    if (this.tables.length === 0) {
      return false;
    }

    if (confirm('Sind Sie sicher, dass Sie alle Tische löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      this.tables = [];
      this.nextTableId = 1;
      this.saveTables();
      this.onTablesChange();
      return true;
    }
    return false;
  }

  updateTablePosition(id: string, x: number, y: number): void {
    const table = this.tables.find(t => t.id === id);
    if (!table) return;

    if (table.isGeschenke) {
      const minX = ROOM_MARGIN;
      const maxX = ROOM_WIDTH - 61 - ROOM_MARGIN;
      table.x = Math.max(minX, Math.min(maxX, x));
      table.y = ROOM_MARGIN;
    } else if (table.isRoyal) {
      const royalTableWidth = table.seats === 6 ? 55 : 61;
      const royalContainerWidth = royalTableWidth + 12 + 4;
      const minX = ROOM_WIDTH - royalContainerWidth - ROOM_MARGIN;
      const minY = ROOM_MARGIN;
      const maxY = ROOM_HEIGHT - 33 - ROOM_MARGIN;

      table.x = minX;
      table.y = Math.max(minY, Math.min(maxY, y));
    } else {
      const minX = ROOM_MARGIN;
      const minY = ROOM_MARGIN;
      const maxX = ROOM_WIDTH - 85;
      const maxY = ROOM_HEIGHT - 57;

      table.x = Math.max(minX, Math.min(maxX, x));
      table.y = Math.max(minY, Math.min(maxY, y));
    }

    this.saveTables();
    this.onTablesChange();
  }

  rotateTable(id: string): void {
    const table = this.tables.find(t => t.id === id);
    if (table) {
      table.rotation = (table.rotation + 45) % 360;
      this.saveTables();
      this.onTablesChange();
    }
  }

  getTableById(id: string): Table | undefined {
    return this.tables.find(t => t.id === id);
  }

  ensureGeschenkeTable(): void {
    if (!this.tables.find(t => t.id === 'geschenke-table')) {
      const geschenkeTable: Table = {
        id: 'geschenke-table',
        x: 100,
        y: 20,
        seats: 8,
        isRoyal: false,
        isGeschenke: true,
        tableNumber: 'Geschenke',
        rotation: 0
      };
      this.tables.push(geschenkeTable);
      this.saveTables();
      this.onTablesChange();
    }
  }

  static getTableDimensions(table: Table): TableDimensions {
    const { seats, isRoyal, isGeschenke } = table;
    let tableWidth: number, tableHeight: number, containerWidth: number, containerHeight: number;

    if (isGeschenke) {
      tableWidth = 61;
      tableHeight = 33;
      containerWidth = 61;
      containerHeight = 33;
    } else if (isRoyal) {
      if (seats === 6) {
        tableWidth = 55;
        tableHeight = 33;
        containerWidth = 55 + 12 + 4;
        containerHeight = 33;
      } else if (seats === 8) {
        tableWidth = 61;
        tableHeight = 33;
        containerWidth = 61 + 12 + 4;
        containerHeight = 33;
      } else {
        tableWidth = 61;
        tableHeight = 33;
        containerWidth = 61 + 12 + 4;
        containerHeight = 33;
      }
    } else {
      if (seats === 6) {
        tableWidth = 55;
        tableHeight = 33;
        containerWidth = 79;
        containerHeight = 57;
      } else if (seats === 8) {
        tableWidth = 61;
        tableHeight = 33;
        containerWidth = 85;
        containerHeight = 57;
      } else {
        tableWidth = 55;
        tableHeight = 33;
        containerWidth = 79;
        containerHeight = 57;
      }
    }

    return { tableWidth, tableHeight, containerWidth, containerHeight };
  }
}

