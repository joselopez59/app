// Importar tipos y servicios
import { Table, Position, DragOffset, DraggedElement, FOTOBOX_SIZE, ROOM_WIDTH, ROOM_HEIGHT, ROOM_MARGIN } from './types/index';
import { StorageService } from './services/StorageService';
import { TableService } from './services/TableService';

// Estado de la aplicación
let draggedTable: string | null = null;
let draggedElement: DraggedElement = null;
let dragOffset: DragOffset = { x: 0, y: 0 };
let selectedTable: string | null = null;
let isDragging: boolean = false;
let djPosition: Position = { x: 945, y: 430 };
let fotoBoxPosition: Position = { x: 50, y: 400 };

// Elementos del DOM
const floorPlan = document.getElementById('floorPlan') as HTMLElement;
const tablesList = document.getElementById('tablesList') as HTMLElement;
const addTableButtons = document.querySelectorAll('.btn-add-table');
const clearAllBtn = document.getElementById('clearAllBtn');

// Servicio de mesas
let tableService: TableService;

// Inicialización
function init(): void {
  // Cargar posiciones de elementos arrastrables
  const { djPosition: savedDjPos, fotoBoxPosition: savedFotoBoxPos } = StorageService.loadDraggablePositions();
  djPosition = savedDjPos;
  fotoBoxPosition = savedFotoBoxPos;

  // Inicializar servicio de mesas
  tableService = new TableService(() => {
    renderTables();
  });

  // Event listeners para añadir mesas
  addTableButtons.forEach(button => {
    button.addEventListener('click', () => {
      const seats = parseInt(button.getAttribute('data-seats') || '6');
      tableService.addTable(seats, false);
    });
  });

  // Event listener para Tisch Royal
  const addRoyalBtn = document.getElementById('addRoyalBtn');
  const royalControls = document.getElementById('royalControls');
  const confirmRoyalBtn = document.getElementById('confirmRoyalBtn');

  if (addRoyalBtn && royalControls) {
    addRoyalBtn.addEventListener('click', () => {
      royalControls.style.display = royalControls.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (confirmRoyalBtn) {
    confirmRoyalBtn.addEventListener('click', () => {
      const seats = parseInt((document.getElementById('royalSeats') as HTMLInputElement).value) || 4;
      if (seats >= 1 && seats <= 8) {
        tableService.addTable(seats, true);
        if (royalControls) royalControls.style.display = 'none';
      }
    });
  }

  // Event listeners para drag & drop
  floorPlan.addEventListener('mousemove', handleMouseMove);
  floorPlan.addEventListener('mouseup', handleMouseUp);
  floorPlan.addEventListener('mouseleave', handleMouseUp);

  // Ocultar controles de rotación al hacer clic fuera de las mesas
  floorPlan.addEventListener('click', (e) => {
    if (e.target === floorPlan || (e.target as HTMLElement).classList.contains('floor-plan-svg')) {
      hideRotationControls();
    }
  });

  // Event listener para borrar todas las mesas
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      tableService.clearAllTables();
    });
  }

  // Inicializar drag & drop para DJ y FotoBox
  initDraggableElements();

  // Inicializar mesa Geschenke si no existe
  tableService.ensureGeschenkeTable();

  // Renderizar mesas iniciales
  renderTables();
}

// Inicializar elementos arrastrables (DJ y FotoBox)
function initDraggableElements(): void {
  const djMixer = document.getElementById('djMixer') as SVGGElement | null;
  const fotoBox = document.getElementById('fotoBox') as SVGRectElement | null;

  if (djMixer) {
    djMixer.setAttribute('transform', `rotate(-45, ${djPosition.x}, ${djPosition.y})`);
    const djElements = djMixer.querySelectorAll('*');
    djElements.forEach(el => {
      (el as HTMLElement).addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDraggableMouseDown(e, 'dj');
      });
      (el as HTMLElement).style.cursor = 'move';
      (el as HTMLElement).style.pointerEvents = 'all';
    });
    djMixer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleDraggableMouseDown(e, 'dj');
    });
    djMixer.style.cursor = 'move';
  }

  if (fotoBox) {
    fotoBox.setAttribute('x', fotoBoxPosition.x.toString());
    fotoBox.setAttribute('y', fotoBoxPosition.y.toString());
    const fotoBoxText = document.getElementById('fotoBoxText') as SVGTextElement | null;
    if (fotoBoxText) {
      fotoBoxText.setAttribute('x', (fotoBoxPosition.x + FOTOBOX_SIZE / 2).toString());
      fotoBoxText.setAttribute('y', (fotoBoxPosition.y + FOTOBOX_SIZE / 2 + 4).toString());
    }
    fotoBox.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleDraggableMouseDown(e, 'fotoBox');
    });
    fotoBox.style.cursor = 'move';
    fotoBox.style.pointerEvents = 'all';
  }
}

// Manejar inicio de drag para elementos arrastrables
function handleDraggableMouseDown(e: MouseEvent, elementType: 'dj' | 'fotoBox'): void {
  e.preventDefault();
  e.stopPropagation();

  if (draggedTable) {
    draggedTable = null;
  }

  draggedElement = elementType;
  const svg = floorPlan.querySelector('svg');
  if (!svg) return;
  const svgRect = svg.getBoundingClientRect();

  if (elementType === 'dj') {
    dragOffset.x = (e.clientX - svgRect.left) - djPosition.x;
    dragOffset.y = (e.clientY - svgRect.top) - djPosition.y;
  } else if (elementType === 'fotoBox') {
    dragOffset.x = (e.clientX - svgRect.left) - fotoBoxPosition.x;
    dragOffset.y = (e.clientY - svgRect.top) - fotoBoxPosition.y;
  }
}

// Rotar una mesa 45 grados
function rotateTable(id: string): void {
  tableService.rotateTable(id);
  setTimeout(() => {
    showRotationControls(id);
  }, 10);
}

// Mostrar controles de rotación para una mesa
function showRotationControls(tableId: string): void {
  hideRotationControls();

  const tableElement = floorPlan.querySelector(`[data-id="${tableId}"]`);
  if (!tableElement) return;

  const table = tableService.getTableById(tableId);
  if (!table) return;

  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'rotation-controls';
  controlsDiv.setAttribute('data-table-id', tableId);

  const rotateBtn = document.createElement('button');
  rotateBtn.className = 'rotate-btn';
  rotateBtn.innerHTML = '↻';
  rotateBtn.title = '45° drehen';
  rotateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    rotateTable(tableId);
  });

  controlsDiv.appendChild(rotateBtn);
  controlsDiv.style.left = `${table.x + 70}px`;
  controlsDiv.style.top = `${table.y}px`;

  floorPlan.appendChild(controlsDiv);
  selectedTable = tableId;
}

// Ocultar controles de rotación
function hideRotationControls(): void {
  const existingControls = floorPlan.querySelectorAll('.rotation-controls');
  existingControls.forEach(control => control.remove());
  selectedTable = null;
}

// Renderizar todas las mesas
function renderTables(): void {
  const existingTables = floorPlan.querySelectorAll('.table');
  existingTables.forEach(table => table.remove());

  hideRotationControls();

  const tables = tableService.getTables();
  tables.forEach(table => {
    const tableElement = createTableElement(table);
    floorPlan.appendChild(tableElement);
  });

  renderTablesList();
}

// Crear elemento DOM para una mesa
function createTableElement(table: Table): HTMLElement {
  const tableDiv = document.createElement('div');
  tableDiv.className = 'table';
  tableDiv.setAttribute('data-id', table.id);
  tableDiv.style.left = `${table.x}px`;
  tableDiv.style.top = `${table.y}px`;

  if (table.rotation && table.rotation !== 0) {
    tableDiv.style.transform = `rotate(${table.rotation}deg)`;
    tableDiv.style.transformOrigin = 'center center';
  }

  const dimensions = TableService.getTableDimensions(table);
  const { tableWidth, tableHeight, containerWidth, containerHeight } = dimensions;

  const containerCenterX = containerWidth / 2;
  const containerCenterY = containerHeight / 2;

  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-container';
  tableContainer.style.width = `${containerWidth}px`;
  tableContainer.style.height = `${containerHeight}px`;

  const chairsContainer = document.createElement('div');
  chairsContainer.className = 'chairs-container';

  const chairDistance = 4;
  const chairSize = 12;

  if (table.isGeschenke) {
    // Sin sillas
  } else if (table.isRoyal) {
    for (let i = 0; i < table.seats; i++) {
      const offset = (i + 1) * (tableHeight / (table.seats + 1)) - tableHeight / 2;
      const chair = document.createElement('div');
      chair.className = 'chair';
      chair.style.left = `${containerCenterX + tableWidth/2 + chairDistance - chairSize/2}px`;
      chair.style.top = `${containerCenterY + offset - chairSize/2}px`;
      chairsContainer.appendChild(chair);
    }
  } else {
    let seatsTop = 0, seatsBottom = 0, seatsRight = 0, seatsLeft = 0;

    if (table.seats === 6) {
      seatsTop = 2;
      seatsBottom = 2;
      seatsRight = 1;
      seatsLeft = 1;
    } else if (table.seats === 8) {
      seatsTop = 3;
      seatsBottom = 3;
      seatsRight = 1;
      seatsLeft = 1;
    }

    for (let i = 0; i < seatsTop; i++) {
      const offset = (i + 1) * (tableWidth / (seatsTop + 1)) - tableWidth / 2;
      const chair = document.createElement('div');
      chair.className = 'chair';
      chair.style.left = `${containerCenterX + offset - chairSize/2}px`;
      chair.style.top = `${containerCenterY - tableHeight/2 - chairDistance - chairSize/2}px`;
      chairsContainer.appendChild(chair);
    }

    if (seatsRight > 0) {
      const chair = document.createElement('div');
      chair.className = 'chair';
      chair.style.left = `${containerCenterX + tableWidth/2 + chairDistance - chairSize/2}px`;
      chair.style.top = `${containerCenterY - chairSize/2}px`;
      chairsContainer.appendChild(chair);
    }

    for (let i = 0; i < seatsBottom; i++) {
      const offset = (i + 1) * (tableWidth / (seatsBottom + 1)) - tableWidth / 2;
      const chair = document.createElement('div');
      chair.className = 'chair';
      chair.style.left = `${containerCenterX - offset - chairSize/2}px`;
      chair.style.top = `${containerCenterY + tableHeight/2 + chairDistance - chairSize/2}px`;
      chairsContainer.appendChild(chair);
    }

    if (seatsLeft > 0) {
      const chair = document.createElement('div');
      chair.className = 'chair';
      chair.style.left = `${containerCenterX - tableWidth/2 - chairDistance - chairSize/2}px`;
      chair.style.top = `${containerCenterY - chairSize/2}px`;
      chairsContainer.appendChild(chair);
    }
  }

  const circle = document.createElement('div');
  circle.className = 'table-circle';
  circle.style.width = `${tableWidth}px`;
  circle.style.height = `${tableHeight}px`;

  const seats = document.createElement('div');
  seats.className = 'table-seats';
  if (table.isGeschenke) {
    seats.textContent = 'Geschenke';
  } else {
    seats.textContent = String(table.tableNumber || table.id.replace('table-', ''));
  }
  circle.appendChild(seats);

  tableContainer.appendChild(chairsContainer);
  tableContainer.appendChild(circle);
  tableDiv.appendChild(tableContainer);

  tableDiv.addEventListener('mousedown', (e) => handleMouseDown(e, table.id));

  return tableDiv;
}

// Renderizar lista de mesas en el sidebar
function renderTablesList(): void {
  const tables = tableService.getTables();
  
  if (tables.length === 0) {
    tablesList.innerHTML = '<p class="empty-message">Keine Tische vorhanden. Fügen Sie einen hinzu, um zu beginnen.</p>';
    return;
  }

  tablesList.innerHTML = '';

  tables.forEach(table => {
    const item = document.createElement('div');
    item.className = 'table-item';

    const info = document.createElement('div');
    info.className = 'table-item-info';

    const label = document.createElement('span');
    label.className = 'table-item-label';
    if (table.isGeschenke) {
      label.textContent = 'Geschenke';
    } else {
      label.textContent = `Tisch ${table.id.replace('table-', '')}`;
    }

    const seats = document.createElement('span');
    seats.className = 'table-item-seats';
    if (table.isGeschenke) {
      seats.textContent = '';
    } else {
      seats.textContent = `${table.seats} Personen`;
    }

    info.appendChild(label);
    info.appendChild(seats);

    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'btn-rotate';
    rotateBtn.textContent = '↻';
    rotateBtn.title = 'Tisch um 45° drehen';
    rotateBtn.addEventListener('click', () => rotateTable(table.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Tisch löschen';
    deleteBtn.addEventListener('click', () => {
      tableService.deleteTable(table.id);
    });

    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '0.5rem';
    buttonsContainer.appendChild(rotateBtn);
    buttonsContainer.appendChild(deleteBtn);

    item.appendChild(info);
    item.appendChild(buttonsContainer);
    tablesList.appendChild(item);
  });
}

// Manejar inicio de drag
function handleMouseDown(e: MouseEvent, tableId: string): void {
  e.preventDefault();
  const table = tableService.getTableById(tableId);
  if (!table) return;

  const rect = floorPlan.getBoundingClientRect();
  const offsetX = e.clientX - rect.left - table.x;
  const offsetY = e.clientY - rect.top - table.y;

  draggedTable = tableId;
  dragOffset = { x: offsetX, y: offsetY };

  const tableElement = floorPlan.querySelector(`[data-id="${tableId}"]`);
  if (tableElement) {
    tableElement.classList.add('dragging');
  }
}

// Manejar movimiento durante drag
function handleMouseMove(e: MouseEvent): void {
  if (!draggedElement && !draggedTable) return;

  const svg = floorPlan.querySelector('svg');
  if (!svg) return;
  const svgRect = svg.getBoundingClientRect();

  if (draggedElement === 'dj') {
    let x = (e.clientX - svgRect.left) - dragOffset.x;
    let y = (e.clientY - svgRect.top) - dragOffset.y;

    x = Math.max(50, Math.min(950, x));
    y = Math.max(50, Math.min(450, y));

    djPosition = { x, y };
    const djMixer = document.getElementById('djMixer') as SVGGElement | null;
    if (djMixer) {
      djMixer.setAttribute('transform', `rotate(-45, ${x}, ${y})`);
    }
    StorageService.saveDraggablePositions(djPosition, fotoBoxPosition);
  } else if (draggedElement === 'fotoBox') {
    let x = (e.clientX - svgRect.left) - dragOffset.x;
    let y = (e.clientY - svgRect.top) - dragOffset.y;

    x = Math.max(20, Math.min(ROOM_WIDTH - FOTOBOX_SIZE - 20, x));
    y = Math.max(20, Math.min(ROOM_HEIGHT - FOTOBOX_SIZE - 20, y));

    fotoBoxPosition = { x, y };
    const fotoBox = document.getElementById('fotoBox') as SVGRectElement | null;
    const fotoBoxText = document.getElementById('fotoBoxText') as SVGTextElement | null;
    if (fotoBox) {
      fotoBox.setAttribute('x', x.toString());
      fotoBox.setAttribute('y', y.toString());
      if (fotoBoxText) {
        fotoBoxText.setAttribute('x', (x + FOTOBOX_SIZE / 2).toString());
        fotoBoxText.setAttribute('y', (y + FOTOBOX_SIZE / 2 + 4).toString());
      }
    }
    StorageService.saveDraggablePositions(djPosition, fotoBoxPosition);
  } else if (draggedTable) {
    isDragging = true;
    const rect = floorPlan.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    tableService.updateTablePosition(draggedTable, x, y);
  }
}

// Manejar fin de drag
function handleMouseUp(e: MouseEvent): void {
  if (draggedTable) {
    const tableElement = floorPlan.querySelector(`[data-id="${draggedTable}"]`);
    if (tableElement) {
      tableElement.classList.remove('dragging');
    }

    if (!isDragging) {
      selectedTable = draggedTable;
      showRotationControls(draggedTable);
    }

    draggedTable = null;
    isDragging = false;
  }
  if (draggedElement) {
    draggedElement = null;
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

