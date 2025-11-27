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
      // Tisch Royal: calcular posición basada en dimensiones dinámicas
      const tempTable: Table = {
        id: 'temp',
        x: 0,
        y: 250,
        seats,
        isRoyal: true,
        isGeschenke: false,
        tableNumber: 'R',
        rotation: 90 // Rotada 90° para calcular dimensiones correctas
      };
      const dimensions = TableService.getTableDimensions(tempTable);
      const royalContainerWidth = dimensions.containerWidth;
      x = ROOM_WIDTH - royalContainerWidth - ROOM_MARGIN; // Pegada a la pared derecha
      y = 250; // Centro vertical
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
      tableNumber: isRoyal ? 'R' : this.nextTableId, // Tisch Royal tiene etiqueta 'R'
      rotation: isRoyal ? 90 : 0 // Tisch Royal rotada 90° para que el lado largo esté vertical
    };

    this.tables.push(newTable);
    this.nextTableId++;
    
    // Si es Tisch Royal, ajustar posición para asegurar que esté correctamente posicionada
    if (isRoyal) {
      this.updateTablePosition(newTable.id, x, y);
    } else {
      this.saveTables();
      this.onTablesChange();
    }
  }

  deleteTable(id: string): void {
    this.tables = this.tables.filter(table => table.id !== id);
    this.saveTables();
    this.onTablesChange();
  }

  duplicateTable(id: string): void {
    const table = this.tables.find(t => t.id === id);
    if (!table) return;

    // Calcular posición de la copia: a la derecha de la original con cierta distancia
    const dimensions = TableService.getTableDimensions(table);
    const distance = 50; // Distancia entre la original y la copia (50px)
    let newX = table.x + dimensions.containerWidth + distance;
    let newY = table.y;

    // Asegurar que la copia esté dentro de los límites de la sala
    const minX = ROOM_MARGIN;
    const minY = ROOM_MARGIN;
    const maxX = ROOM_WIDTH - dimensions.containerWidth - ROOM_MARGIN;
    const maxY = ROOM_HEIGHT - dimensions.containerHeight - ROOM_MARGIN;

    // Si la copia se sale por la derecha, ajustar posición
    if (newX > maxX) {
      newX = Math.max(minX, maxX);
      // Si aún no cabe, ponerla a la izquierda de la original
      if (newX >= table.x) {
        newX = Math.max(minX, table.x - dimensions.containerWidth - distance);
      }
    }

    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));

    const duplicatedTable: Table = {
      id: `table-${this.nextTableId}`,
      x: newX,
      y: newY,
      seats: table.seats,
      isRoyal: table.isRoyal,
      isGeschenke: false, // La copia nunca será Geschenke
      tableNumber: table.isRoyal ? 'R' : this.nextTableId,
      rotation: table.rotation
    };

    this.tables.push(duplicatedTable);
    this.nextTableId++;
    this.saveTables();
    this.onTablesChange();
  }

  duplicateTables(ids: string[]): void {
    // Encontrar el punto más a la derecha y más a la izquierda del grupo de mesas seleccionadas
    const selectedTables = this.tables.filter(t => ids.includes(t.id));
    if (selectedTables.length === 0) return;

    let maxRight = 0;
    let minLeft = Infinity;

    selectedTables.forEach(table => {
      const dimensions = TableService.getTableDimensions(table);
      const right = table.x + dimensions.containerWidth;
      if (right > maxRight) maxRight = right;
      if (table.x < minLeft) minLeft = table.x;
    });

    const distance = 50; // Distancia entre el grupo original y las copias
    const groupWidth = maxRight - minLeft;
    const offsetX = groupWidth + distance;

    // Verificar si hay espacio suficiente
    const minX = ROOM_MARGIN;
    const maxX = ROOM_WIDTH - ROOM_MARGIN;
    
    if (maxRight + distance + groupWidth > maxX - 100) {
      // No hay espacio suficiente a la derecha, no duplicar
      return;
    }

    // Duplicar todas las mesas manteniendo sus posiciones relativas
    const duplicatedTables: Table[] = [];
    selectedTables.forEach(table => {
      const dimensions = TableService.getTableDimensions(table);
      // Mantener la posición relativa al grupo: añadir el offset al X original
      let newX = table.x + offsetX;
      let newY = table.y;

      // Asegurar que las copias estén dentro de los límites
      const maxTableX = ROOM_WIDTH - dimensions.containerWidth - ROOM_MARGIN;
      const maxTableY = ROOM_HEIGHT - dimensions.containerHeight - ROOM_MARGIN;
      
      newX = Math.max(minX, Math.min(maxTableX, newX));
      newY = Math.max(ROOM_MARGIN, Math.min(maxTableY, newY));

      const duplicatedTable: Table = {
        id: `table-${this.nextTableId}`,
        x: newX,
        y: newY,
        seats: table.seats,
        isRoyal: table.isRoyal,
        isGeschenke: false,
        tableNumber: table.isRoyal ? 'R' : this.nextTableId,
        rotation: table.rotation
      };

      duplicatedTables.push(duplicatedTable);
      this.nextTableId++;
    });

    // Añadir todas las mesas duplicadas
    this.tables.push(...duplicatedTables);
    this.saveTables();
    this.onTablesChange();
  }

  deleteTables(ids: string[]): void {
    this.tables = this.tables.filter(table => !ids.includes(table.id));
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
      // Mesa Geschenke: puede moverse libremente
      const dimensions = TableService.getTableDimensions(table);
      const minX = ROOM_MARGIN;
      const maxX = ROOM_WIDTH - dimensions.containerWidth - ROOM_MARGIN;
      const minY = ROOM_MARGIN;
      const maxY = ROOM_HEIGHT - dimensions.containerHeight - ROOM_MARGIN;
      
      table.x = Math.max(minX, Math.min(maxX, x));
      table.y = Math.max(minY, Math.min(maxY, y));
    } else if (table.isRoyal) {
      // Tisch Royal: siempre paralelo a la pared derecha, solo se mueve verticalmente
      // Calcular ancho dinámico según número de sillas (se recalcula cada vez que se mueve)
      const dimensions = TableService.getTableDimensions(table);
      const royalContainerWidth = dimensions.containerWidth;
      const royalContainerHeight = dimensions.containerHeight;
      const minX = ROOM_WIDTH - royalContainerWidth - ROOM_MARGIN;
      const minY = ROOM_MARGIN;
      const maxY = ROOM_HEIGHT - royalContainerHeight - ROOM_MARGIN;

      table.x = minX; // X fijo, paralelo a la pared derecha
      table.y = Math.max(minY, Math.min(maxY, y)); // Solo Y se puede mover
      
      // Asegurar que la posición X esté correcta después de calcular dimensiones
      if (table.x < ROOM_MARGIN) {
        table.x = ROOM_MARGIN;
      }
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
      // Tisch Royal no puede rotarse, siempre debe estar a 90°
      if (table.isRoyal) {
        return;
      }
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
        x: 0, // Totalmente arrimada a la pared izquierda (x = 0)
        y: 400, // Cerca del FotoBox, debajo de la puerta (puerta termina en y=325)
        seats: 8,
        isRoyal: false,
        isGeschenke: true,
        tableNumber: 'Geschenke',
        rotation: 90 // Rotada 90° para que el lado largo (61cm) esté vertical y pegado a la pared
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
      // Tisch Royal: longitud dinámica según número de sillas
      // La mesa está rotada 90°, así que:
      // - tableWidth es el lado corto (horizontal cuando rotada)
      // - tableHeight es el lado largo (vertical cuando rotada) - este es el que varía
      
      const shortSide = 33; // Lado corto fijo (igual que altura de otras mesas)
      tableWidth = shortSide; // Lado corto (será vertical cuando rotada)
      
      // Calcular longitud del lado largo basado en número de sillas
      // Cada silla necesita ~12cm de espacio, más espacio entre sillas
      // Mínimo: 40cm (para 1 silla), máximo: ~120cm (para 8 sillas)
      // Fórmula: baseLength + (seats * chairSpacing)
      const baseLength = 40; // Longitud mínima
      const chairSpacing = 10; // Espacio por silla (10cm)
      tableHeight = Math.max(baseLength, Math.min(120, baseLength + (seats * chairSpacing)));
      
      // El contenedor necesita espacio para las sillas en el lado izquierdo (hacia el interior)
      // Las sillas están en el lado largo izquierdo (vertical, hacia el interior de la sala)
      const chairSize = 12; // Tamaño de silla
      const chairDistance = 4; // Distancia de la mesa a la silla
      // Cuando rotada 90°, el ancho del contenedor incluye espacio para sillas a la izquierda
      containerWidth = tableWidth + (chairSize + chairDistance) * 2; // Espacio para sillas a ambos lados
      containerHeight = tableHeight + (chairSize + chairDistance) * 2; // Espacio para sillas arriba y abajo
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

