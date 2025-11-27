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
let djPosition: Position = { x: 900, y: 400 };
let djRotation: number = 0;
let djWasDragged: boolean = false;
let fotoBoxPosition: Position = { x: 50, y: 400 };

// Estado para selección múltiple
let isSelecting: boolean = false;
let selectionStart: Position | null = null;
let selectionEnd: Position | null = null;
let selectedTables: string[] = [];
let selectionBox: HTMLElement | null = null;
let initialTablePositions: Map<string, Position> = new Map();

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
  const { djPosition: savedDjPos, fotoBoxPosition: savedFotoBoxPos, djRotation: savedDjRot } = StorageService.loadDraggablePositions();
  djPosition = savedDjPos;
  fotoBoxPosition = savedFotoBoxPos;
  djRotation = savedDjRot;

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
  floorPlan.addEventListener('mousedown', handleFloorPlanMouseDown);

  // Ocultar controles de rotación al hacer clic fuera de las mesas o DJ
  floorPlan.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === floorPlan || target.classList.contains('floor-plan-svg') || 
        (target.tagName !== 'g' && !target.closest('#djMixer'))) {
      hideRotationControls();
    }
  });

  // Event listener para borrar todas las mesas
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      tableService.clearAllTables();
    });
  }

  // Event listeners para el carrusel vertical de mesas
  const scrollUpBtn = document.getElementById('scrollUpBtn');
  const scrollDownBtn = document.getElementById('scrollDownBtn');
  const tablesListElement = document.getElementById('tablesList');

  if (scrollUpBtn && tablesListElement) {
    scrollUpBtn.addEventListener('click', () => {
      const itemHeight = 50 + 12; // height + gap
      tablesListElement.scrollBy({ top: -itemHeight * 3, behavior: 'smooth' });
    });
  }

  if (scrollDownBtn && tablesListElement) {
    scrollDownBtn.addEventListener('click', () => {
      const itemHeight = 50 + 12; // height + gap
      tablesListElement.scrollBy({ top: itemHeight * 3, behavior: 'smooth' });
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
    const centerX = djPosition.x;
    const centerY = djPosition.y;
    djMixer.setAttribute('transform', `translate(${djPosition.x - 900}, ${djPosition.y - 400}) rotate(${djRotation}, ${centerX}, ${centerY})`);
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
    // Añadir listener para clic en el DJ para mostrar controles de rotación
    djMixer.addEventListener('mousedown', () => {
      djWasDragged = false;
    });
    djMixer.addEventListener('click', (e) => {
      if (!djWasDragged) {
        e.stopPropagation();
        showDjRotationControls();
      }
    });
    djMixer.style.cursor = 'move';
  }

  if (fotoBox) {
    fotoBox.setAttribute('x', fotoBoxPosition.x.toString());
    fotoBox.setAttribute('y', fotoBoxPosition.y.toString());
    const fotoBoxText = document.getElementById('fotoBoxText') as SVGTextElement | null;
    const fotoBoxText2 = document.getElementById('fotoBoxText2') as SVGTextElement | null;
    if (fotoBoxText) {
      fotoBoxText.setAttribute('x', (fotoBoxPosition.x + FOTOBOX_SIZE / 2).toString());
      fotoBoxText.setAttribute('y', (fotoBoxPosition.y + FOTOBOX_SIZE / 2 - 5).toString());
    }
    if (fotoBoxText2) {
      fotoBoxText2.setAttribute('x', (fotoBoxPosition.x + FOTOBOX_SIZE / 2).toString());
      fotoBoxText2.setAttribute('y', (fotoBoxPosition.y + FOTOBOX_SIZE / 2 + 8).toString());
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

// Mostrar controles para una mesa (rotar, duplicar, borrar)
function showRotationControls(tableId: string): void {
  hideRotationControls();

  const tableElement = floorPlan.querySelector(`[data-id="${tableId}"]`);
  if (!tableElement) return;

  const table = tableService.getTableById(tableId);
  if (!table) return;

  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'rotation-controls';
  controlsDiv.setAttribute('data-table-id', tableId);

  // Botón de rotar (solo si no es Tisch Royal)
  if (!table.isRoyal) {
    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'table-control-btn rotate-btn';
    rotateBtn.innerHTML = '↻';
    rotateBtn.title = '45° drehen';
    rotateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      rotateTable(tableId);
    });
    controlsDiv.appendChild(rotateBtn);
  }
  // Geschenke también puede rotarse

  // Botón de duplicar
  const duplicateBtn = document.createElement('button');
  duplicateBtn.className = 'table-control-btn duplicate-btn';
  duplicateBtn.innerHTML = '⧉';
  duplicateBtn.title = 'Tisch duplizieren';
  duplicateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    tableService.duplicateTable(tableId);
  });
  controlsDiv.appendChild(duplicateBtn);

  // Botón de borrar
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'table-control-btn delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.title = 'Tisch löschen';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    tableService.deleteTable(tableId);
  });
  controlsDiv.appendChild(deleteBtn);

  const dimensions = TableService.getTableDimensions(table);
  controlsDiv.style.left = `${table.x + dimensions.containerWidth / 2 - 40}px`;
  controlsDiv.style.top = `${table.y - 35}px`;

  floorPlan.appendChild(controlsDiv);
  selectedTable = tableId;
}

// Mostrar controles para selección múltiple (duplicar, borrar)
function showMultiSelectionControls(): void {
  hideRotationControls();

  if (selectedTables.length < 2) return;

  // Calcular posición central del grupo de mesas seleccionadas
  let centerX = 0;
  let centerY = 0;
  let count = 0;

  selectedTables.forEach(tableId => {
    const table = tableService.getTableById(tableId);
    if (table) {
      const dimensions = TableService.getTableDimensions(table);
      centerX += table.x + dimensions.containerWidth / 2;
      centerY += table.y + dimensions.containerHeight / 2;
      count++;
    }
  });

  if (count === 0) return;

  centerX = centerX / count;
  centerY = centerY / count;

  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'rotation-controls multi-selection-controls';
  controlsDiv.setAttribute('data-selection', 'multi');

  // Botón de duplicar grupo
  const duplicateBtn = document.createElement('button');
  duplicateBtn.className = 'table-control-btn duplicate-btn';
  duplicateBtn.innerHTML = '⧉';
  duplicateBtn.title = `${selectedTables.length} Tische duplizieren`;
  duplicateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    tableService.duplicateTables(selectedTables);
  });
  controlsDiv.appendChild(duplicateBtn);

  // Botón de borrar grupo
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'table-control-btn delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.title = `${selectedTables.length} Tische löschen`;
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm(`Möchten Sie wirklich ${selectedTables.length} Tische löschen?`)) {
      tableService.deleteTables(selectedTables);
      clearSelection();
    }
  });
  controlsDiv.appendChild(deleteBtn);

  controlsDiv.style.left = `${centerX}px`;
  controlsDiv.style.top = `${centerY - 30}px`;

  floorPlan.appendChild(controlsDiv);
}

// Ocultar controles de rotación
function hideRotationControls(): void {
  const existingControls = floorPlan.querySelectorAll('.rotation-controls');
  existingControls.forEach(control => control.remove());
  const djControls = floorPlan.querySelectorAll('.dj-rotation-controls');
  djControls.forEach(control => control.remove());
  selectedTable = null;
}

// Rotar DJ
function rotateDj(): void {
  djRotation = (djRotation + 45) % 360;
  const djMixer = document.getElementById('djMixer') as SVGGElement | null;
  if (djMixer) {
    const centerX = djPosition.x;
    const centerY = djPosition.y;
    djMixer.setAttribute('transform', `translate(${djPosition.x - 900}, ${djPosition.y - 400}) rotate(${djRotation}, ${centerX}, ${centerY})`);
  }
  StorageService.saveDraggablePositions(djPosition, fotoBoxPosition, djRotation);
  setTimeout(() => {
    showDjRotationControls();
  }, 10);
}

// Mostrar controles de rotación para el DJ
function showDjRotationControls(): void {
  hideRotationControls();

  const djMixer = document.getElementById('djMixer') as SVGGElement | null;
  if (!djMixer) return;

  const svg = floorPlan.querySelector('svg');
  if (!svg) return;

  const svgRect = svg.getBoundingClientRect();
  const centerX = djPosition.x;
  const centerY = djPosition.y;

  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'rotation-controls dj-rotation-controls';
  controlsDiv.setAttribute('data-dj', 'true');

  const rotateBtn = document.createElement('button');
  rotateBtn.className = 'table-control-btn rotate-btn';
  rotateBtn.innerHTML = '↻';
  rotateBtn.title = '45° drehen';
  rotateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    rotateDj();
  });
  controlsDiv.appendChild(rotateBtn);

  const left = centerX + svgRect.left - floorPlan.getBoundingClientRect().left;
  const top = centerY + svgRect.top - floorPlan.getBoundingClientRect().top;

  controlsDiv.style.left = `${left - 12}px`;
  controlsDiv.style.top = `${top - 50}px`;
  controlsDiv.style.position = 'absolute';

  floorPlan.appendChild(controlsDiv);
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

  // Actualizar visualización de selección después de renderizar
  updateSelectionVisual();

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
    // Tisch Royal: sillas solo en uno de los lados largos (lado izquierdo, hacia el interior de la sala)
    // La mesa está rotada 90° y pegada a la pared derecha
    // El lado largo es tableHeight (vertical), las sillas están en el lado izquierdo
    const chairSize = 12;
    const chairDistance = 4;
    
    // Distribuir sillas verticalmente en el lado izquierdo (lado largo)
    // Las sillas se alinean verticalmente a lo largo del lado izquierdo de la mesa
    for (let i = 0; i < table.seats; i++) {
      const chair = document.createElement('div');
      chair.className = 'chair';
      
      // Distribuir sillas uniformemente a lo largo del lado largo (tableHeight)
      // El lado largo es tableHeight, distribuir sillas verticalmente
      const spacing = tableHeight / (table.seats + 1);
      const chairY = containerCenterY - tableHeight/2 + (i + 1) * spacing;
      
      // Las sillas están en el lado izquierdo (hacia el interior de la sala)
      chair.style.left = `${containerCenterX - tableWidth/2 - chairDistance - chairSize/2}px`;
      chair.style.top = `${chairY - chairSize/2}px`;
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
  } else if (table.isRoyal) {
    seats.textContent = 'R'; // Tisch Royal muestra "R"
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
  const scrollUpBtn = document.getElementById('scrollUpBtn');
  const scrollDownBtn = document.getElementById('scrollDownBtn');
  
  if (tables.length === 0) {
    tablesList.innerHTML = '<p class="empty-message">Keine Tische vorhanden. Fügen Sie einen hinzu, um zu beginnen.</p>';
    if (scrollUpBtn) scrollUpBtn.style.display = 'none';
    if (scrollDownBtn) scrollDownBtn.style.display = 'none';
    return;
  }

  tablesList.innerHTML = '';

  // Mostrar/ocultar flechas según el número de mesas
  const shouldShowArrows = tables.length > 3;
  if (scrollUpBtn) scrollUpBtn.style.display = shouldShowArrows ? 'flex' : 'none';
  if (scrollDownBtn) scrollDownBtn.style.display = shouldShowArrows ? 'flex' : 'none';

  // Asegurar que siempre haya espacio para 3 karts
  const itemHeight = 50;
  const gap = 12;
  const minHeight = (itemHeight + gap) * 3 - gap;
  tablesList.style.minHeight = `${minHeight}px`;

  tables.forEach(table => {
    const item = document.createElement('div');
    item.className = 'table-item';

    const info = document.createElement('div');
    info.className = 'table-item-info';

    const label = document.createElement('span');
    label.className = 'table-item-label';
    if (table.isGeschenke) {
      label.textContent = 'Geschenke';
    } else if (table.isRoyal) {
      label.textContent = 'Tisch Royal';
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
    // Tisch Royal no puede rotarse
    if (!table.isRoyal) {
      rotateBtn.addEventListener('click', () => rotateTable(table.id));
    } else {
      rotateBtn.style.display = 'none'; // Ocultar botón para Tisch Royal
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Tisch löschen';
    deleteBtn.addEventListener('click', () => {
      tableService.deleteTable(table.id);
    });

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'table-item-buttons';
    buttonsContainer.appendChild(rotateBtn);
    buttonsContainer.appendChild(deleteBtn);

    item.appendChild(info);
    item.appendChild(buttonsContainer);
    tablesList.appendChild(item);
  });
}

// Manejar clic en el plano (para iniciar selección múltiple)
function handleFloorPlanMouseDown(e: MouseEvent): void {
  // Solo iniciar selección si no se hace clic en una mesa o elemento arrastrable
  const target = e.target as HTMLElement;
  if (target.closest('.table') || target.closest('#djMixer') || target.closest('#fotoBox')) {
    return;
  }
  
  // Si se hace clic en el plano vacío, iniciar selección múltiple
  if (target === floorPlan || target.classList.contains('floor-plan-svg') || target.tagName === 'rect' || target.tagName === 'line' || target.tagName === 'circle' || target.tagName === 'g') {
    if (!e.shiftKey) {
      clearSelection();
    }
    
    isSelecting = true;
    const rect = floorPlan.getBoundingClientRect();
    selectionStart = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    selectionEnd = { ...selectionStart };
    
    // Crear rectángulo de selección si no existe
    if (!selectionBox) {
      selectionBox = document.createElement('div');
      selectionBox.className = 'selection-box';
      selectionBox.style.position = 'absolute';
      selectionBox.style.border = '2px dashed #4a90e2';
      selectionBox.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
      selectionBox.style.pointerEvents = 'none';
      selectionBox.style.zIndex = '1000';
      floorPlan.appendChild(selectionBox);
    }
    
    updateSelectionBox();
  }
}

// Manejar inicio de drag
function handleMouseDown(e: MouseEvent, tableId: string): void {
  e.preventDefault();
  e.stopPropagation(); // Evitar que se active la selección múltiple
  
  // Si hay mesas seleccionadas y esta mesa está seleccionada, mover todas juntas
  if (selectedTables.includes(tableId) && selectedTables.length > 1) {
    const rect = floorPlan.getBoundingClientRect();
    const table = tableService.getTableById(tableId);
    if (!table) return;
    
    // Guardar posiciones iniciales de todas las mesas seleccionadas
    initialTablePositions.clear();
    selectedTables.forEach(id => {
      const t = tableService.getTableById(id);
      if (t) {
        initialTablePositions.set(id, { x: t.x, y: t.y });
      }
    });
    
    const offsetX = e.clientX - rect.left - table.x;
    const offsetY = e.clientY - rect.top - table.y;
    
    draggedTable = tableId;
    dragOffset = { x: offsetX, y: offsetY };
    
    // Marcar todas las mesas seleccionadas como dragging
    selectedTables.forEach(id => {
      const tableElement = floorPlan.querySelector(`[data-id="${id}"]`);
      if (tableElement) {
        tableElement.classList.add('dragging');
      }
    });
  } else {
    // Selección única
    if (!e.shiftKey) {
      clearSelection();
    }
    addToSelection(tableId);
    
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
    
    // Mostrar controles inmediatamente al seleccionar
    updateSelectionVisual();
  }
}

// Actualizar rectángulo de selección
function updateSelectionBox(): void {
  if (!selectionBox || !selectionStart || !selectionEnd) return;
  
  const left = Math.min(selectionStart.x, selectionEnd.x);
  const top = Math.min(selectionStart.y, selectionEnd.y);
  const width = Math.abs(selectionEnd.x - selectionStart.x);
  const height = Math.abs(selectionEnd.y - selectionStart.y);
  
  selectionBox.style.left = `${left}px`;
  selectionBox.style.top = `${top}px`;
  selectionBox.style.width = `${width}px`;
  selectionBox.style.height = `${height}px`;
  selectionBox.style.display = width > 5 && height > 5 ? 'block' : 'none';
  
  // Detectar mesas dentro del rectángulo
  if (width > 5 && height > 5) {
    detectTablesInSelection(left, top, width, height);
  }
}

// Detectar mesas dentro del rectángulo de selección
function detectTablesInSelection(left: number, top: number, width: number, height: number): void {
  const tables = tableService.getTables();
  const newSelection: string[] = [];
  
  tables.forEach(table => {
    const tableElement = floorPlan.querySelector(`[data-id="${table.id}"]`) as HTMLElement;
    if (!tableElement) return;
    
    const tableRect = tableElement.getBoundingClientRect();
    const floorRect = floorPlan.getBoundingClientRect();
    
    const tableLeft = tableRect.left - floorRect.left;
    const tableTop = tableRect.top - floorRect.top;
    const tableRight = tableLeft + tableRect.width;
    const tableBottom = tableTop + tableRect.height;
    
    // Verificar si la mesa está dentro del rectángulo de selección
    if (tableLeft < left + width && tableRight > left &&
        tableTop < top + height && tableBottom > top) {
      newSelection.push(table.id);
    }
  });
  
  // Actualizar selección (siempre reemplazar, no combinar)
  selectedTables = newSelection;
  
  updateSelectionVisual();
}

// Actualizar visualización de mesas seleccionadas
function updateSelectionVisual(): void {
  const tables = tableService.getTables();
  tables.forEach(table => {
    const tableElement = floorPlan.querySelector(`[data-id="${table.id}"]`) as HTMLElement;
    if (tableElement) {
      if (selectedTables.includes(table.id)) {
        tableElement.classList.add('selected');
      } else {
        tableElement.classList.remove('selected');
      }
    }
  });

  // Mostrar controles según el número de mesas seleccionadas
  if (selectedTables.length === 1) {
    showRotationControls(selectedTables[0]);
  } else if (selectedTables.length > 1) {
    showMultiSelectionControls();
  } else {
    hideRotationControls();
  }
}

// Añadir mesa a la selección
function addToSelection(tableId: string): void {
  if (!selectedTables.includes(tableId)) {
    selectedTables.push(tableId);
    updateSelectionVisual();
  }
}

// Limpiar selección
function clearSelection(): void {
  selectedTables = [];
  updateSelectionVisual();
  hideRotationControls();
}

// Manejar movimiento durante drag
function handleMouseMove(e: MouseEvent): void {
  // Manejar selección múltiple
  if (isSelecting && selectionStart) {
    const rect = floorPlan.getBoundingClientRect();
    selectionEnd = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    updateSelectionBox();
    return;
  }
  
  if (!draggedElement && !draggedTable) return;

  const svg = floorPlan.querySelector('svg');
  if (!svg) return;
  const svgRect = svg.getBoundingClientRect();

  if (draggedElement === 'dj') {
    djWasDragged = true;
    let x = (e.clientX - svgRect.left) - dragOffset.x;
    let y = (e.clientY - svgRect.top) - dragOffset.y;

    // Permitir movimiento libre, solo asegurar que no se salga completamente de la sala
    const djWidth = 140;
    const djHeight = 60;
    x = Math.max(20 - djWidth, Math.min(ROOM_WIDTH - 20, x));
    y = Math.max(20 - djHeight, Math.min(ROOM_HEIGHT - 20, y));

    djPosition = { x, y };
    const djMixer = document.getElementById('djMixer') as SVGGElement | null;
    if (djMixer) {
      const centerX = djPosition.x;
      const centerY = djPosition.y;
      djMixer.setAttribute('transform', `translate(${x - 900}, ${y - 400}) rotate(${djRotation}, ${centerX}, ${centerY})`);
    }
    StorageService.saveDraggablePositions(djPosition, fotoBoxPosition, djRotation);
  } else if (draggedElement === 'fotoBox') {
    let x = (e.clientX - svgRect.left) - dragOffset.x;
    let y = (e.clientY - svgRect.top) - dragOffset.y;

    x = Math.max(20, Math.min(ROOM_WIDTH - FOTOBOX_SIZE - 20, x));
    y = Math.max(20, Math.min(ROOM_HEIGHT - FOTOBOX_SIZE - 20, y));

    fotoBoxPosition = { x, y };
    const fotoBox = document.getElementById('fotoBox') as SVGRectElement | null;
    const fotoBoxText = document.getElementById('fotoBoxText') as SVGTextElement | null;
    const fotoBoxText2 = document.getElementById('fotoBoxText2') as SVGTextElement | null;
    if (fotoBox) {
      fotoBox.setAttribute('x', x.toString());
      fotoBox.setAttribute('y', y.toString());
      if (fotoBoxText) {
        fotoBoxText.setAttribute('x', (x + FOTOBOX_SIZE / 2).toString());
        fotoBoxText.setAttribute('y', (y + FOTOBOX_SIZE / 2 - 5).toString());
      }
      if (fotoBoxText2) {
        fotoBoxText2.setAttribute('x', (x + FOTOBOX_SIZE / 2).toString());
        fotoBoxText2.setAttribute('y', (y + FOTOBOX_SIZE / 2 + 8).toString());
      }
    }
    StorageService.saveDraggablePositions(djPosition, fotoBoxPosition, djRotation);
  } else if (draggedTable) {
    isDragging = true;
    const rect = floorPlan.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Si hay múltiples mesas seleccionadas, mover todas juntas
    if (selectedTables.length > 1 && selectedTables.includes(draggedTable)) {
      const mainTable = tableService.getTableById(draggedTable);
      if (mainTable) {
        const deltaX = x - mainTable.x;
        const deltaY = y - mainTable.y;
        
        // Mover todas las mesas seleccionadas
        selectedTables.forEach(tableId => {
          const initialPos = initialTablePositions.get(tableId);
          if (initialPos) {
            const newX = initialPos.x + deltaX;
            const newY = initialPos.y + deltaY;
            tableService.updateTablePosition(tableId, newX, newY);
          }
        });
      }
    } else {
      tableService.updateTablePosition(draggedTable, x, y);
    }
  }
}

// Manejar fin de drag
function handleMouseUp(e: MouseEvent): void {
  // Finalizar selección múltiple
  if (isSelecting) {
    isSelecting = false;
    floorPlan.classList.remove('selecting');
    // No ocultar el rectángulo de selección si hay mesas seleccionadas
    if (selectionBox && selectedTables.length === 0) {
      selectionBox.style.display = 'none';
    }
    selectionStart = null;
    selectionEnd = null;
    
    // Los controles se actualizan automáticamente en updateSelectionVisual
    return;
  }
  
  if (draggedTable) {
    // Remover clase dragging de todas las mesas
    if (selectedTables.length > 1 && selectedTables.includes(draggedTable)) {
      selectedTables.forEach(id => {
        const tableElement = floorPlan.querySelector(`[data-id="${id}"]`);
        if (tableElement) {
          tableElement.classList.remove('dragging');
        }
      });
    } else {
      const tableElement = floorPlan.querySelector(`[data-id="${draggedTable}"]`);
      if (tableElement) {
        tableElement.classList.remove('dragging');
      }
    }

    draggedTable = null;
    isDragging = false;
    initialTablePositions.clear();
    
    // Mostrar controles si hay mesas seleccionadas
    if (selectedTables.length > 0) {
      updateSelectionVisual();
    }
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

