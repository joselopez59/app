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
let djPosition: Position = { x: 900, y: 400 }; // Posición inicial en el bottom del floor-plan
let djRotation: number = 0;
let djWasDragged: boolean = false;
let fotoBoxPosition: Position = { x: 400, y: 400 }; // Posición inicial en el bottom del floor-plan

// Estado para selección múltiple
let isSelecting: boolean = false;
let selectionStart: Position | null = null;
let selectionEnd: Position | null = null;
let selectedTables: string[] = [];
let selectionBox: HTMLElement | null = null;
let initialTablePositions: Map<string, Position> = new Map();

// Elementos del DOM
const floorPlan = document.getElementById('floorPlan') as HTMLElement;
const clearAllBtn = document.getElementById('clearAllBtn');
const calculatedTablesContainer = document.getElementById('calculatedTablesContainer') as HTMLElement;

// Servicio de mesas
let tableService: TableService;

// Auto-configurar mesas según el número de personas
function autoConfigureTables(): void {
  const personasInput = document.getElementById('personasInput') as HTMLInputElement;
  if (!personasInput) return;

  const totalPersonas = parseInt(personasInput.value) || 38;
  const validPersonas = Math.max(10, Math.min(100, totalPersonas));

  // Eliminar todas las mesas excepto Geschenke
  const tables = tableService.getTables();
  const tablesToDelete = tables.filter(t => !t.isGeschenke).map(t => t.id);
  if (tablesToDelete.length > 0) {
    tableService.deleteTables(tablesToDelete);
  }

  // Calcular distribución de mesas:
  // 1. Llenar mesas de 8 personas hasta su capacidad máxima
  // 2. Llenar mesas de 6 personas si hace falta
  // 3. Si quedan personas, crear una mesa normal con el número exacto de sillas
  let remainingPersonas = validPersonas;
  const tablesToCreate: number[] = []; // Array con el número de sillas de cada mesa

  // Primero, crear mesas completas de 8 personas
  const tables8 = Math.floor(remainingPersonas / 8);
  remainingPersonas = remainingPersonas % 8;
  for (let i = 0; i < tables8; i++) {
    tablesToCreate.push(8);
  }

  // Luego, crear mesas completas de 6 personas si hace falta
  if (remainingPersonas > 0) {
    const tables6 = Math.floor(remainingPersonas / 6);
    remainingPersonas = remainingPersonas % 6;
    for (let i = 0; i < tables6; i++) {
      tablesToCreate.push(6);
    }
  }

  // Si quedan personas que no llenan una mesa completa, crear una mesa normal con ese número exacto
  if (remainingPersonas > 0) {
    tablesToCreate.push(remainingPersonas);
  }

  // Limitar a máximo 13 mesas (según el requisito "Max. 13")
  if (tablesToCreate.length > 13) {
    // Reducir mesas, priorizando las de 8 personas
    const excess = tablesToCreate.length - 13;
    // Eliminar las últimas mesas (que serán las más pequeñas)
    for (let i = 0; i < excess; i++) {
      tablesToCreate.pop();
    }
    // Recalcular personas restantes y añadir una mesa con el número exacto
    const totalSeats = tablesToCreate.reduce((sum, seats) => sum + seats, 0);
    remainingPersonas = validPersonas - totalSeats;
    if (remainingPersonas > 0 && tablesToCreate.length < 13) {
      tablesToCreate.push(remainingPersonas);
    }
  }

  // Crear todas las mesas según el array calculado
  // Las mesas se crearán con una posición especial (y = ROOM_HEIGHT + 50) para indicar que están en el sidebar
  const startY = ROOM_HEIGHT + 50; // Posición especial para mesas en el sidebar
  
  for (const seats of tablesToCreate) {
    // Obtener mesas antes de crear la nueva
    const tablesBefore = tableService.getTables().filter(t => !t.isGeschenke);
    tableService.addTable(seats, false); // Crear mesa normal con el número exacto de sillas
    // Obtener mesas después de crear
    const tablesAfter = tableService.getTables().filter(t => !t.isGeschenke);
    // Encontrar la nueva mesa (la que no estaba antes)
    const newTable = tablesAfter.find(t => !tablesBefore.some(tb => tb.id === t.id));
    if (newTable) {
      // Posicionar la mesa en el área del sidebar (no visible en el floorPlan)
      tableService.updateTablePosition(newTable.id, 0, startY);
    }
  }

  // Renderizar las mesas calculadas en el contenedor de la kart 'Tische'
  // Usar setTimeout para asegurar que las mesas se hayan actualizado en el servicio
  // y que renderTables() no haya limpiado el sidebar
  setTimeout(() => {
    const updatedTables = tableService.getTables().filter(t => !t.isGeschenke && t.y >= ROOM_HEIGHT && t.y < ROOM_HEIGHT + 200);
    if (updatedTables.length > 0 && calculatedTablesContainer) {
      renderCalculatedTables(updatedTables);
    }
    
    // Reposicionar Geschenke y FotoBox en un renglón debajo de las mesas calculadas
    repositionGeschenkeAndFotoBox();
  }, 50);
}

// Renderizar mesas calculadas en el contenedor de la kart 'Tische'
function renderCalculatedTables(tables: Table[]): void {
  // Obtener el contenedor cada vez para asegurar que existe
  const container = document.getElementById('calculatedTablesContainer') as HTMLElement;
  if (!container) {
    console.error('calculatedTablesContainer no encontrado en el DOM');
    return;
  }
  
  console.log('renderCalculatedTables llamado con', tables.length, 'mesas');
  console.log('Contenedor encontrado:', container);
  console.log('Contenedor parent:', container.parentElement);
  console.log('Contenedor está en sidebar?', container.closest('.table-list') !== null);
  
  // Limpiar contenedor completamente
  container.innerHTML = '';
  
  if (tables.length === 0) {
    console.log('No hay mesas para renderizar');
    return;
  }
  
  const tablesPerRow = 4;
  const spacingX = 60; // Espaciado horizontal entre mesas (más pequeño para el sidebar)
  const spacingY = 60; // Espaciado vertical entre filas
  
  // Crear contenedor de filas
  const rowsContainer = document.createElement('div');
  rowsContainer.style.display = 'flex';
  rowsContainer.style.flexDirection = 'column';
  rowsContainer.style.alignItems = 'center';
  rowsContainer.style.gap = `${spacingY}px`;
  rowsContainer.style.marginTop = '0.5rem';
  rowsContainer.style.width = '100%';
  
  // Agrupar mesas en filas
  for (let i = 0; i < tables.length; i += tablesPerRow) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'center';
    row.style.alignItems = 'center';
    row.style.gap = `${spacingX}px`;
    row.style.flexWrap = 'wrap';
    row.style.width = '100%';
    
    const rowTables = tables.slice(i, i + tablesPerRow);
    rowTables.forEach(table => {
      const tableElement = createTableElementForSidebar(table);
      row.appendChild(tableElement);
    });
    
    rowsContainer.appendChild(row);
  }
  
  // Asegurar que el contenedor esté en el sidebar
  const tableList = container.closest('.table-list');
  if (!tableList) {
    console.error('ERROR CRÍTICO: calculatedTablesContainer no está dentro de .table-list!');
    console.log('Container parent:', container.parentElement);
    console.log('Container parent classes:', container.parentElement?.className);
    console.log('Container está en floor-plan?', container.closest('.floor-plan-container') !== null);
    console.log('Container está en floor-plan?', container.closest('.floor-plan') !== null);
    // Intentar mover el contenedor al sidebar si está en el lugar equivocado
    const correctParent = document.querySelector('.table-list');
    if (correctParent && container.parentElement !== correctParent) {
      console.log('Intentando mover calculatedTablesContainer al sidebar...');
      // No mover, solo reportar el error
    }
    return; // No renderizar si el contenedor no está en el lugar correcto
  } else {
    console.log('✓ calculatedTablesContainer está correctamente en el sidebar');
  }
  
  container.appendChild(rowsContainer);
  console.log('✓ Mesas renderizadas en calculatedTablesContainer. Total elementos hijos:', container.children.length);
  console.log('✓ Contenedor final:', container);
  console.log('✓ Contenedor parent final:', container.parentElement);
}

// Crear elemento de mesa para el sidebar (versión más pequeña y arrastrable)
function createTableElementForSidebar(table: Table): HTMLElement {
  const tableDiv = document.createElement('div');
  tableDiv.className = 'table table-sidebar';
  tableDiv.setAttribute('data-id', table.id);
  // IMPORTANTE: Las mesas del sidebar NO deben usar posiciones absolutas
  // Deben estar en el flujo normal del documento dentro del sidebar
  tableDiv.style.position = 'relative';
  tableDiv.style.left = 'auto';
  tableDiv.style.top = 'auto';
  tableDiv.style.right = 'auto';
  tableDiv.style.bottom = 'auto';
  tableDiv.style.margin = '0 auto';
  tableDiv.style.cursor = 'move';
  tableDiv.style.transform = 'scale(0.6)'; // Hacer las mesas más pequeñas para el sidebar
  tableDiv.style.transformOrigin = 'center center';
  tableDiv.style.display = 'inline-block'; // Para que se comporten como elementos inline-block
  
  const dimensions = TableService.getTableDimensions(table);
  const { tableWidth, tableHeight, containerWidth, containerHeight } = dimensions;

  const containerCenterX = containerWidth / 2;
  const containerCenterY = containerHeight / 2;

  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-container';
  tableContainer.style.width = `${containerWidth}px`;
  tableContainer.style.height = `${containerHeight}px`;

  // Crear sillas y mesa (código similar a createTableElement pero simplificado)
  const chairsContainer = document.createElement('div');
  chairsContainer.className = 'chairs-container';

  const chairDistance = 4;
  const chairSize = 12;

  // Renderizar sillas (código simplificado, similar al original)
  if (!table.isGeschenke && !table.isRoyal) {
    let seatsTop = 0, seatsBottom = 0, seatsRight = 0, seatsLeft = 0;
    const totalSeats = table.seats;
    
    if (totalSeats <= 6) {
      if (totalSeats <= 2) {
        seatsTop = totalSeats;
      } else if (totalSeats <= 4) {
        seatsTop = Math.ceil(totalSeats / 2);
        seatsBottom = totalSeats - seatsTop;
      } else {
        seatsTop = 2;
        seatsBottom = 2;
        const remaining = totalSeats - 4;
        seatsRight = Math.ceil(remaining / 2);
        seatsLeft = remaining - seatsRight;
      }
    } else {
      seatsTop = Math.ceil(totalSeats / 4);
      seatsBottom = Math.ceil(totalSeats / 4);
      const remaining = totalSeats - seatsTop - seatsBottom;
      seatsRight = Math.ceil(remaining / 2);
      seatsLeft = remaining - seatsRight;
    }
    
    const currentTotal = seatsTop + seatsBottom + seatsRight + seatsLeft;
    if (currentTotal < totalSeats) {
      seatsTop += totalSeats - currentTotal;
    } else if (currentTotal > totalSeats) {
      seatsTop = Math.max(0, seatsTop - (currentTotal - totalSeats));
    }
    
    // Renderizar sillas
    for (let i = 0; i < seatsTop; i++) {
      const offset = seatsTop > 1 ? (i + 1) * (tableWidth / (seatsTop + 1)) - tableWidth / 2 : 0;
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
      const offset = seatsBottom > 1 ? (i + 1) * (tableWidth / (seatsBottom + 1)) - tableWidth / 2 : 0;
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
    seats.textContent = 'R';
  } else {
    seats.textContent = String(table.tableNumber || table.id.replace('table-', ''));
  }
  circle.appendChild(seats);

  tableContainer.appendChild(chairsContainer);
  tableContainer.appendChild(circle);
  tableDiv.appendChild(tableContainer);
  
  // Añadir event listener para arrastrar desde el sidebar al floorPlan
  tableDiv.addEventListener('mousedown', (e) => {
    e.preventDefault();
    handleSidebarTableMouseDown(e, table.id);
  });
  
  return tableDiv;
}

// Manejar inicio de drag desde el sidebar
function handleSidebarTableMouseDown(e: MouseEvent, tableId: string): void {
  e.preventDefault();
  e.stopPropagation();
  
  // Mover la mesa al floorPlan cuando se arrastra desde el sidebar
  const table = tableService.getTableById(tableId);
  if (!table) return;
  
  // Posicionar la mesa en el floorPlan en la posición del mouse relativa al floorPlan
  const floorRect = floorPlan.getBoundingClientRect();
  const x = e.clientX - floorRect.left;
  const y = e.clientY - floorRect.top;
  
  // Asegurar que esté dentro de los límites
  const dimensions = TableService.getTableDimensions(table);
  const minX = ROOM_MARGIN;
  const minY = ROOM_MARGIN;
  const maxX = ROOM_WIDTH - dimensions.containerWidth - ROOM_MARGIN;
  const maxY = ROOM_HEIGHT - dimensions.containerHeight - ROOM_MARGIN;
  
  const finalX = Math.max(minX, Math.min(maxX, x - dimensions.containerWidth / 2));
  const finalY = Math.max(minY, Math.min(maxY, y - dimensions.containerHeight / 2));
  
  tableService.updateTablePosition(tableId, finalX, finalY);
  
  // Iniciar drag normal
  handleMouseDown(e, tableId);
}

// Calcular posición para Geschenke y FotoBox debajo de las mesas calculadas
function repositionGeschenkeAndFotoBox(): void {
  const tables = tableService.getTables().filter(t => !t.isGeschenke);
  const spacingY = 70; // Espaciado vertical entre filas (mismo que en el sidebar)
  const tablesPerRow = 4; // Número de mesas por fila
  const startY = ROOM_HEIGHT + 50; // Posición inicial Y de las mesas calculadas (en el sidebar)
  
  // Calcular cuántas filas hay
  const numRows = Math.ceil(tables.length / tablesPerRow);
  const geschenkeY = startY + (numRows * spacingY) + spacingY; // Un renglón más abajo
  
  // Reposicionar Geschenke
  const geschenkeTable = tableService.getTableById('geschenke-table');
  if (geschenkeTable) {
    const startX = ROOM_MARGIN + 50;
    tableService.updateTablePosition('geschenke-table', startX, geschenkeY);
  }
  
  // Reposicionar FotoBox
  const startX = ROOM_MARGIN + 150;
  fotoBoxPosition = { x: startX, y: geschenkeY };
  const fotoBox = document.getElementById('fotoBox') as SVGRectElement | null;
  const fotoBoxText = document.getElementById('fotoBoxText') as SVGTextElement | null;
  const fotoBoxText2 = document.getElementById('fotoBoxText2') as SVGTextElement | null;
  if (fotoBox) {
    fotoBox.setAttribute('x', fotoBoxPosition.x.toString());
    fotoBox.setAttribute('y', fotoBoxPosition.y.toString());
    if (fotoBoxText) {
      fotoBoxText.setAttribute('x', (fotoBoxPosition.x + FOTOBOX_SIZE / 2).toString());
      fotoBoxText.setAttribute('y', (fotoBoxPosition.y + FOTOBOX_SIZE / 2 - 5).toString());
    }
    if (fotoBoxText2) {
      fotoBoxText2.setAttribute('x', (fotoBoxPosition.x + FOTOBOX_SIZE / 2).toString());
      fotoBoxText2.setAttribute('y', (fotoBoxPosition.y + FOTOBOX_SIZE / 2 + 8).toString());
    }
    StorageService.saveDraggablePositions(djPosition, fotoBoxPosition, djRotation);
  }
}

// Inicialización
function init(): void {
  // Cargar posiciones de elementos arrastrables
  const { djPosition: savedDjPos, fotoBoxPosition: savedFotoBoxPos, djRotation: savedDjRot } = StorageService.loadDraggablePositions();
  djPosition = savedDjPos;
  djRotation = savedDjRot;

  // Inicializar servicio de mesas
  tableService = new TableService(() => {
    renderTables();
  });
  
  // Si FotoBox está dentro de la sala, reposicionarlo fuera (después de inicializar tableService)
  if (savedFotoBoxPos.y < ROOM_HEIGHT) {
    const tables = tableService.getTables().filter(t => !t.isGeschenke);
    const startY = ROOM_HEIGHT + 50;
    const spacingY = 80;
    const tablesPerRow = 6;
    const numRows = Math.ceil(tables.length / tablesPerRow);
    const fotoBoxY = startY + (numRows * spacingY) + spacingY;
    fotoBoxPosition = { x: ROOM_MARGIN + 150, y: fotoBoxY };
  } else {
    fotoBoxPosition = savedFotoBoxPos;
  }



  // Event listeners para el input de personas
  const personasInput = document.getElementById('personasInput') as HTMLInputElement;
  const increasePersonasBtn = document.getElementById('increasePersonasBtn');
  const decreasePersonasBtn = document.getElementById('decreasePersonasBtn');

  if (increasePersonasBtn && personasInput) {
    increasePersonasBtn.addEventListener('click', () => {
      const currentValue = parseInt(personasInput.value) || 38;
      if (currentValue < 100) {
        personasInput.value = (currentValue + 1).toString();
        autoConfigureTables();
      }
    });
  }

  if (decreasePersonasBtn && personasInput) {
    decreasePersonasBtn.addEventListener('click', () => {
      const currentValue = parseInt(personasInput.value) || 38;
      if (currentValue > 10) {
        personasInput.value = (currentValue - 1).toString();
        autoConfigureTables();
      }
    });
  }

  // Validar el input mientras se escribe y recalcular mesas automáticamente
  if (personasInput) {
    personasInput.addEventListener('input', () => {
      const value = parseInt(personasInput.value);
      if (isNaN(value) || value < 10) {
        personasInput.value = '10';
      } else if (value > 100) {
        personasInput.value = '100';
      }
      autoConfigureTables();
    });

    personasInput.addEventListener('blur', () => {
      const value = parseInt(personasInput.value);
      if (isNaN(value) || value < 10) {
        personasInput.value = '10';
      } else if (value > 100) {
        personasInput.value = '100';
      } else {
        personasInput.value = value.toString();
      }
      autoConfigureTables();
    });
  }

  // Event listeners para drag & drop
  floorPlan.addEventListener('mousemove', handleMouseMove);
  floorPlan.addEventListener('mouseup', handleMouseUp);
  floorPlan.addEventListener('mouseleave', handleMouseUp);
  floorPlan.addEventListener('mousedown', handleFloorPlanMouseDown);

  // Event listeners globales para drag & drop
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  // Ocultar controles de rotación al hacer clic fuera de las mesas o DJ
  floorPlan.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === floorPlan || target.classList.contains('floor-plan-svg') || 
        (target.tagName !== 'g' && !target.closest('#djMixer'))) {
      hideRotationControls();
    }
  });

  // Event listener para RESET - reiniciar la app con el número de personas actual
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      // Obtener el número de personas actual
      const personasInput = document.getElementById('personasInput') as HTMLInputElement;
      const currentPersonas = personasInput ? parseInt(personasInput.value) || 38 : 38;
      
      // Borrar todas las mesas
      tableService.clearAllTables();
      
      // Reposicionar Geschenke y FotoBox
      repositionGeschenkeAndFotoBox();
      
      // Recalcular mesas con el número de personas actual
      setTimeout(() => {
        autoConfigureTables();
      }, 50);
    });
  }


  // Inicializar drag & drop para DJ y FotoBox
  initDraggableElements();

  // Inicializar mesa Geschenke si no existe
  tableService.ensureGeschenkeTable();

  // Reposicionar Geschenke y FotoBox fuera de la sala si es necesario
  repositionGeschenkeAndFotoBox();

  // Renderizar mesas iniciales
  renderTables();

  // Calcular y mostrar mesas automáticamente al inicializar con el valor por defecto (38)
  // Usar setTimeout para asegurar que todo esté inicializado
  setTimeout(() => {
    autoConfigureTables();
  }, 100);
}

// Inicializar elementos arrastrables (DJ y FotoBox)
function initDraggableElements(): void {
  const svg = floorPlan.querySelector('svg.floor-plan-svg') as SVGSVGElement | null;
  if (!svg) return;

  const djMixer = document.getElementById('djMixer') as SVGGElement | null;
  const fotoBox = document.getElementById('fotoBox') as SVGRectElement | null;

  if (djMixer) {
    // Aplicar transformación inicial del DJ
    const centerX = djPosition.x;
    const centerY = djPosition.y;
    djMixer.setAttribute('transform', `translate(${djPosition.x - 900}, ${djPosition.y - 400}) rotate(${djRotation}, ${centerX}, ${centerY})`);
    
    // Añadir event listeners para DJ
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
    // Aplicar posición inicial del FotoBox
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
    
    // Añadir event listeners para FotoBox
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
  const svg = floorPlan.querySelector('svg.floor-plan-svg') as SVGSVGElement | null;
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

// Mostrar controles para una mesa (rotar, cambiar sillas, duplicar, borrar)
function showRotationControls(tableId: string): void {
  hideRotationControls();

  const tableElement = floorPlan.querySelector(`[data-id="${tableId}"]`);
  if (!tableElement) return;

  const table = tableService.getTableById(tableId);
  if (!table) return;

  // Verificar si la mesa está dentro de la sala (y < ROOM_HEIGHT)
  const isInsideRoom = table.y < ROOM_HEIGHT;

  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'rotation-controls';
  controlsDiv.setAttribute('data-table-id', tableId);

  // Botón de rotar (solo si no es Tisch Royal y está dentro de la sala)
  if (!table.isRoyal && isInsideRoom) {
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

  // Botón para cambiar entre 6 y 8 plazas (solo para mesas normales)
  if (!table.isRoyal && !table.isGeschenke) {
    const changeSeatsBtn = document.createElement('button');
    changeSeatsBtn.className = 'table-control-btn change-seats-btn';
    const newSeats = table.seats === 6 ? 8 : 6;
    changeSeatsBtn.innerHTML = `${newSeats}`;
    changeSeatsBtn.title = `Zu ${newSeats} Personen ändern`;
    changeSeatsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      tableService.updateTableSeats(tableId, newSeats);
      setTimeout(() => {
        showRotationControls(tableId);
      }, 10);
    });
    controlsDiv.appendChild(changeSeatsBtn);
  }

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

  const svg = floorPlan.querySelector('svg.floor-plan-svg') as SVGSVGElement | null;
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
  // IMPORTANTE: Eliminar TODAS las mesas del floor-plan, incluyendo cualquier mesa del sidebar que se haya renderizado incorrectamente
  const allFloorPlanTables = floorPlan.querySelectorAll('.table');
  allFloorPlanTables.forEach(table => {
    const tableId = table.getAttribute('data-id');
    if (tableId) {
      const tableData = tableService.getTables().find(t => t.id === tableId);
      // Si es una mesa del sidebar, eliminarla del floor-plan
      if (tableData && !tableData.isGeschenke && tableData.y >= ROOM_HEIGHT && tableData.y < ROOM_HEIGHT + 200) {
        console.warn('Eliminando mesa del sidebar que estaba incorrectamente en el floor-plan:', tableId);
        table.remove();
      } else if (!table.classList.contains('table-sidebar')) {
        // Eliminar mesas normales del floor-plan
        table.remove();
      }
    } else {
      // Si no tiene ID, eliminarla de todas formas
      table.remove();
    }
  });

  hideRotationControls();

  const tables = tableService.getTables();
  
  // Separar mesas en dos grupos: las del floor-plan y las del sidebar
  // Las mesas del sidebar tienen y entre ROOM_HEIGHT (500) y ROOM_HEIGHT + 200 (700)
  const floorPlanTables = tables.filter(table => {
    const isInSidebarRange = !table.isGeschenke && table.y >= ROOM_HEIGHT && table.y < ROOM_HEIGHT + 200;
    return !isInSidebarRange;
  });
  const sidebarTables = tables.filter(table => !table.isGeschenke && table.y >= ROOM_HEIGHT && table.y < ROOM_HEIGHT + 200);
  
  console.log('renderTables - floorPlanTables:', floorPlanTables.length, 'sidebarTables:', sidebarTables.length);
  console.log('ROOM_HEIGHT:', ROOM_HEIGHT);
  if (sidebarTables.length > 0) {
    console.log('Sidebar tables y values:', sidebarTables.map(t => ({ id: t.id, y: t.y })));
  }
  
  // Renderizar solo las mesas del floor-plan en el floorPlan
  // IMPORTANTE: NO renderizar mesas del sidebar aquí - se renderizan en el sidebar
  floorPlanTables.forEach(table => {
    // Verificar una vez más que no sea una mesa del sidebar
    const isSidebarTable = !table.isGeschenke && table.y >= ROOM_HEIGHT && table.y < ROOM_HEIGHT + 200;
    if (!isSidebarTable) {
      const tableElement = createTableElement(table);
      floorPlan.appendChild(tableElement);
    } else {
      console.warn('ERROR: Intento de renderizar mesa del sidebar en floor-plan:', table.id, 'y:', table.y);
    }
  });

  // Renderizar las mesas del sidebar SOLO en el calculatedTablesContainer del sidebar
  // NO renderizarlas en el floor-plan
  const container = document.getElementById('calculatedTablesContainer') as HTMLElement;
  if (container) {
    // Verificar que el contenedor esté en el sidebar
    const isInSidebar = container.closest('.table-list') !== null;
    if (!isInSidebar) {
      console.error('ERROR CRÍTICO: calculatedTablesContainer NO está en el sidebar!');
      console.log('Container parent:', container.parentElement);
      console.log('Container parent classes:', container.parentElement?.className);
      console.log('Container está en floor-plan-container?', container.closest('.floor-plan-container') !== null);
      console.log('Container está en floor-plan?', container.closest('.floor-plan') !== null);
    } else {
      console.log('✓ calculatedTablesContainer está en el sidebar');
    }
    
    if (sidebarTables.length > 0) {
      console.log('Llamando renderCalculatedTables con', sidebarTables.length, 'mesas');
      renderCalculatedTables(sidebarTables);
    } else {
      // Solo limpiar si realmente no hay mesas del sidebar
      container.innerHTML = '';
    }
  } else {
    console.error('ERROR: calculatedTablesContainer no encontrado en renderTables');
  }

  // Actualizar visualización de selección después de renderizar
  updateSelectionVisual();
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
    // Distribuir sillas alrededor de la mesa para cualquier número de sillas
    const totalSeats = table.seats;
    
    // Distribución: priorizar arriba y abajo, luego lados
    let seatsTop = 0, seatsBottom = 0, seatsRight = 0, seatsLeft = 0;
    
    if (totalSeats <= 6) {
      // Para 1-6 sillas: distribución simple similar a mesa de 6
      if (totalSeats <= 2) {
        seatsTop = totalSeats;
      } else if (totalSeats <= 4) {
        seatsTop = Math.ceil(totalSeats / 2);
        seatsBottom = totalSeats - seatsTop;
      } else {
        // 5 o 6 sillas: distribución estándar
        seatsTop = 2;
        seatsBottom = 2;
        const remaining = totalSeats - 4;
        seatsRight = Math.ceil(remaining / 2);
        seatsLeft = remaining - seatsRight;
      }
    } else {
      // Para más de 6 sillas: distribución similar a mesa de 8
      seatsTop = Math.ceil(totalSeats / 4);
      seatsBottom = Math.ceil(totalSeats / 4);
      const remaining = totalSeats - seatsTop - seatsBottom;
      seatsRight = Math.ceil(remaining / 2);
      seatsLeft = remaining - seatsRight;
    }

    // Asegurar que la suma sea exactamente igual a totalSeats
    const currentTotal = seatsTop + seatsBottom + seatsRight + seatsLeft;
    if (currentTotal < totalSeats) {
      // Añadir sillas faltantes arriba
      seatsTop += totalSeats - currentTotal;
    } else if (currentTotal > totalSeats) {
      // Quitar sillas sobrantes de arriba
      const excess = currentTotal - totalSeats;
      seatsTop = Math.max(0, seatsTop - excess);
    }

    // Renderizar sillas arriba
    for (let i = 0; i < seatsTop; i++) {
      const offset = seatsTop > 1 ? (i + 1) * (tableWidth / (seatsTop + 1)) - tableWidth / 2 : 0;
      const chair = document.createElement('div');
      chair.className = 'chair';
      chair.style.left = `${containerCenterX + offset - chairSize/2}px`;
      chair.style.top = `${containerCenterY - tableHeight/2 - chairDistance - chairSize/2}px`;
      chairsContainer.appendChild(chair);
    }

    // Renderizar silla derecha
    if (seatsRight > 0) {
      const chair = document.createElement('div');
      chair.className = 'chair';
      chair.style.left = `${containerCenterX + tableWidth/2 + chairDistance - chairSize/2}px`;
      chair.style.top = `${containerCenterY - chairSize/2}px`;
      chairsContainer.appendChild(chair);
    }

    // Renderizar sillas abajo
    for (let i = 0; i < seatsBottom; i++) {
      const offset = seatsBottom > 1 ? (i + 1) * (tableWidth / (seatsBottom + 1)) - tableWidth / 2 : 0;
      const chair = document.createElement('div');
      chair.className = 'chair';
      chair.style.left = `${containerCenterX - offset - chairSize/2}px`;
      chair.style.top = `${containerCenterY + tableHeight/2 + chairDistance - chairSize/2}px`;
      chairsContainer.appendChild(chair);
    }

    // Renderizar silla izquierda
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

  const svg = floorPlan.querySelector('svg.floor-plan-svg') as SVGSVGElement | null;
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

