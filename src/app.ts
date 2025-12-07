// Importar tipos y servicios
import { Table, Position, DragOffset, DraggedElement, FOTOBOX_SIZE, ROOM_WIDTH, ROOM_HEIGHT, ROOM_MARGIN } from './types/index';
import { StorageService } from './services/StorageService';
import { TableService } from './services/TableService';

// Estado de la aplicación
let draggedTable: string | null = null;
let draggedElement: DraggedElement = null;
let dragOffset: DragOffset = { x: 0, y: 0 };
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
  // Siempre que sea posible, mesas completas de 8 personas
  // Solo la última mesa podrá tener menos de 8
  // Si quedan 7 personas, crear una mesa de 8 con 7 sillas (no una mesa de 6 con 7)
  let remainingPersonas = validPersonas;
  const tablesToCreate: number[] = []; // Array con el número de sillas de cada mesa

  // Crear mesas completas de 8 personas (prioridad)
  const tables8 = Math.floor(remainingPersonas / 8);
  remainingPersonas = remainingPersonas % 8;
  for (let i = 0; i < tables8; i++) {
    tablesToCreate.push(8);
  }

  // Si quedan personas, crear una última mesa
  if (remainingPersonas > 0) {
    // Si quedan 7 personas, crear una mesa de 8 con 7 sillas (no una mesa de 6 con 7)
    if (remainingPersonas === 7) {
      tablesToCreate.push(7); // Mesa de 8 personas pero con 7 sillas visibles
    } else {
      // Para otros casos (1-6), crear mesa con el número exacto
      tablesToCreate.push(remainingPersonas);
    }
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
      // Asegurar que la mesa tenga el número correcto de sillas
      if (newTable.seats !== seats) {
        console.warn(`Mesa ${newTable.id} tiene ${newTable.seats} sillas pero debería tener ${seats}, corrigiendo...`);
        tableService.updateTableSeats(newTable.id, seats);
        // Actualizar la referencia después de cambiar las sillas
        const updatedTable = tableService.getTableById(newTable.id);
        if (updatedTable && updatedTable.seats !== seats) {
          console.error(`Error: No se pudo actualizar las sillas de la mesa ${newTable.id}`);
        }
      }
      // Posicionar la mesa en el área del sidebar (no visible en el floorPlan)
      // Usar updateTablePosition que ahora permite y >= ROOM_HEIGHT
      tableService.updateTablePosition(newTable.id, 0, startY);
      const finalTable = tableService.getTableById(newTable.id);
      console.log(`Mesa ${newTable.id} creada con ${finalTable?.seats || seats} sillas, posicionada en sidebar: y=${startY}`);
    } else {
      console.warn('No se pudo encontrar la nueva mesa después de crearla');
    }
  }
  
  // Verificar que las mesas se hayan posicionado correctamente
  const allTables = tableService.getTables().filter(t => !t.isGeschenke);
  console.log('Mesas creadas - posiciones y:', allTables.map(t => ({ id: t.id, y: t.y })));

  // Renderizar las mesas calculadas en el contenedor de la kart 'Tische'
  // Usar setTimeout para asegurar que las mesas se hayan actualizado en el servicio
  setTimeout(() => {
    const updatedTables = tableService.getTables().filter(t => !t.isGeschenke && t.y >= ROOM_HEIGHT && t.y < ROOM_HEIGHT + 200);
    console.log('autoConfigureTables - Mesas del sidebar encontradas:', updatedTables.length);
    if (updatedTables.length > 0) {
      renderCalculatedTables(updatedTables);
    } else {
      console.warn('No se encontraron mesas del sidebar para renderizar');
    }
    
    // Reposicionar Geschenke y FotoBox en un renglón debajo de las mesas calculadas
    repositionGeschenkeAndFotoBox();
    
    // Forzar un re-renderizado para asegurar que todo esté visible
    renderTables();
  }, 100);
}

// Renderizar mesas calculadas en el contenedor de la kart 'Tische'
function renderCalculatedTables(tables: Table[]): void {
  // Obtener el contenedor cada vez para asegurar que existe
  const container = document.getElementById('calculatedTablesContainer') as HTMLElement;
  if (!container) {
    console.error('calculatedTablesContainer no encontrado en el DOM');
    return;
  }
  
  // Verificar que el contenedor esté en el sidebar ANTES de hacer nada
  const tableList = container.closest('.table-list');
  if (!tableList) {
    console.error('ERROR CRÍTICO: calculatedTablesContainer no está dentro de .table-list!');
    console.log('Container parent:', container.parentElement);
    console.log('Container parent classes:', container.parentElement?.className);
    console.log('Container está en floor-plan-container?', container.closest('.floor-plan-container') !== null);
    console.log('Container está en floor-plan?', container.closest('.floor-plan') !== null);
    return; // No renderizar si el contenedor no está en el lugar correcto
  }
  
  console.log('renderCalculatedTables llamado con', tables.length, 'mesas');
  console.log('✓ calculatedTablesContainer está correctamente en el sidebar');
  
  // Limpiar contenedor completamente
  container.innerHTML = '';
  
  if (tables.length === 0) {
    console.log('No hay mesas para renderizar');
    return;
  }
  
  // 3 COLUMNAS verticales, FILAS horizontales
  const columnsCount = 3;
  const spacingX = 10; // Espaciado horizontal entre columnas
  const spacingY = 25; // Espaciado vertical entre filas
  
  // Calcular cuántas filas necesitamos (redondeado hacia arriba)
  const rowsCount = Math.ceil(tables.length / columnsCount);
  
  // Crear contenedor con scroll y botones de flechas
  const scrollWrapper = document.createElement('div');
  scrollWrapper.style.position = 'relative';
  scrollWrapper.style.width = '100%';
  scrollWrapper.style.overflow = 'hidden';
  scrollWrapper.style.flex = '1';
  scrollWrapper.style.minHeight = '0';
  scrollWrapper.style.display = 'flex';
  scrollWrapper.style.flexDirection = 'column';
  
  // Contenedor interno scrollable
  const scrollableContent = document.createElement('div');
  scrollableContent.style.overflowY = 'auto';
  scrollableContent.style.overflowX = 'hidden';
  scrollableContent.style.flex = '1';
  scrollableContent.style.minHeight = '0';
  scrollableContent.style.width = '100%';
  scrollableContent.style.scrollBehavior = 'smooth';
  scrollableContent.id = 'scrollableTablesContent';
  
  // Contenedor de FILAS (cada fila tiene 4 mesas)
  const rowsContainer = document.createElement('div');
  rowsContainer.style.display = 'flex';
  rowsContainer.style.flexDirection = 'column'; // Filas apiladas verticalmente
  rowsContainer.style.justifyContent = 'flex-start';
  rowsContainer.style.alignItems = 'center';
  rowsContainer.style.gap = `${spacingY}px`;
  rowsContainer.style.width = '100%';
  rowsContainer.style.paddingTop = '0.5rem';
  rowsContainer.style.paddingBottom = '0.5rem';
  
  // Crear las filas (cada fila tiene 3 mesas = 3 columnas)
  // Asegurar alineación vertical entre filas
  const rowDivs: HTMLElement[] = [];
  
  for (let row = 0; row < rowsCount; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.style.display = 'flex';
    rowDiv.style.flexDirection = 'row'; // 3 mesas en fila horizontal
    rowDiv.style.justifyContent = 'center';
    rowDiv.style.alignItems = 'center';
    rowDiv.style.gap = `${spacingX}px`;
    rowDiv.style.width = '100%';
    rowDiv.style.flexWrap = 'nowrap';
    
    // Añadir hasta 3 mesas a esta fila
    for (let col = 0; col < columnsCount; col++) {
      const tableIndex = row * columnsCount + col;
      if (tableIndex < tables.length) {
        const table = tables[tableIndex];
        const tableElement = createTableElementForSidebar(table);
        rowDiv.appendChild(tableElement);
      }
    }
    
    rowDivs.push(rowDiv);
    rowsContainer.appendChild(rowDiv);
  }
  
  // Asegurar que todas las filas tengan el mismo ancho para alineación vertical perfecta
  // Calcular el ancho máximo de todas las filas después de que se rendericen
  setTimeout(() => {
    let maxRowWidth = 0;
    rowDivs.forEach(rowDiv => {
      const rowWidth = rowDiv.scrollWidth;
      if (rowWidth > maxRowWidth) {
        maxRowWidth = rowWidth;
      }
    });
    // Aplicar el mismo ancho a todas las filas para alineación vertical
    if (maxRowWidth > 0) {
      rowDivs.forEach(rowDiv => {
        rowDiv.style.width = `${maxRowWidth}px`;
      });
    }
  }, 0);
  
  scrollableContent.appendChild(rowsContainer);
  scrollWrapper.appendChild(scrollableContent);
  
  // Añadir botones de scroll si hay más de 3 filas
  if (rowsCount > 3) {
    // Botón arriba
    const scrollUpBtn = document.createElement('button');
    scrollUpBtn.innerHTML = '↑';
    scrollUpBtn.className = 'table-scroll-btn table-scroll-up';
    scrollUpBtn.style.position = 'absolute';
    scrollUpBtn.style.top = '5px';
    scrollUpBtn.style.right = '10px';
    scrollUpBtn.style.zIndex = '10';
    scrollUpBtn.addEventListener('click', () => {
      scrollableContent.scrollTop -= 150;
    });
    scrollWrapper.appendChild(scrollUpBtn);
    
    // Botón abajo
    const scrollDownBtn = document.createElement('button');
    scrollDownBtn.innerHTML = '↓';
    scrollDownBtn.className = 'table-scroll-btn table-scroll-down';
    scrollDownBtn.style.position = 'absolute';
    scrollDownBtn.style.bottom = '5px';
    scrollDownBtn.style.right = '10px';
    scrollDownBtn.style.zIndex = '10';
    scrollDownBtn.addEventListener('click', () => {
      scrollableContent.scrollTop += 150;
    });
    scrollWrapper.appendChild(scrollDownBtn);
  }
  
  // Añadir el wrapper con scroll al contenedor principal
  container.appendChild(scrollWrapper);
  
  // Asegurar que el contenedor sea visible
  container.style.display = 'block';
  container.style.visibility = 'visible';
  container.style.opacity = '1';
  
  console.log('✓ Mesas renderizadas en calculatedTablesContainer. Total elementos hijos:', container.children.length);
  console.log('✓ Columnas creadas:', columnsCount, 'Filas por columna:', rowsCount);
  console.log('✓ Total mesas:', tables.length);
  console.log('✓ Botones de scroll:', rowsCount > 3 ? 'Sí' : 'No');
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
  tableDiv.style.transform = 'scale(0.65)'; // Hacer las mesas un poco más grandes para ver mejor las sillas
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
    
    console.log(`Renderizando mesa ${table.id} con ${totalSeats} sillas`);
    
    if (totalSeats === 8) {
      // Para 8 sillas: 3 en cada lado largo (arriba y abajo), 1 en cada lado corto (derecha e izquierda)
      seatsTop = 3;
      seatsBottom = 3;
      seatsRight = 1;
      seatsLeft = 1;
    } else if (totalSeats === 7) {
      // Para 7 sillas: mesa de 8 personas pero con 7 sillas visibles
      // 3 arriba, 3 abajo, 1 a la derecha (o izquierda)
      seatsTop = 3;
      seatsBottom = 3;
      seatsRight = 1;
      seatsLeft = 0;
    } else if (totalSeats <= 6) {
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
      // Para más de 8 sillas: distribución similar
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
    
    // Renderizar sillas arriba
    for (let i = 0; i < seatsTop; i++) {
      const offset = seatsTop > 1 ? (i + 1) * (tableWidth / (seatsTop + 1)) - tableWidth / 2 : 0;
      const chair = document.createElement('div');
      chair.className = 'chair';
      chair.style.left = `${containerCenterX + offset - chairSize/2}px`;
      chair.style.top = `${containerCenterY - tableHeight/2 - chairDistance - chairSize/2}px`;
      chairsContainer.appendChild(chair);
    }
    
    // Renderizar sillas derecha (múltiples si es necesario)
    for (let i = 0; i < seatsRight; i++) {
      const offset = seatsRight > 1 ? (i + 1) * (tableHeight / (seatsRight + 1)) - tableHeight / 2 : 0;
      const chair = document.createElement('div');
      chair.className = 'chair';
      chair.style.left = `${containerCenterX + tableWidth/2 + chairDistance - chairSize/2}px`;
      chair.style.top = `${containerCenterY + offset - chairSize/2}px`;
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
    
    // Renderizar sillas izquierda (múltiples si es necesario)
    for (let i = 0; i < seatsLeft; i++) {
      const offset = seatsLeft > 1 ? (i + 1) * (tableHeight / (seatsLeft + 1)) - tableHeight / 2 : 0;
      const chair = document.createElement('div');
      chair.className = 'chair';
      chair.style.left = `${containerCenterX - tableWidth/2 - chairDistance - chairSize/2}px`;
      chair.style.top = `${containerCenterY + offset - chairSize/2}px`;
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

// Renderizar Geschenke en el contenedor de opciones
function renderGeschenkeInOptions(table: Table): void {
  const geschenkeContainer = document.getElementById('geschenkeContainer') as HTMLElement;
  if (!geschenkeContainer) return;
  
  // Verificar si Geschenke ya está en el floorPlan
  const existingInFloorPlan = floorPlan.querySelector(`[data-id="${table.id}"]`);
  if (existingInFloorPlan) {
    // Ya está en el floorPlan, no renderizar en Optionen
    geschenkeContainer.innerHTML = '';
    return;
  }
  
  // Limpiar contenedor
  geschenkeContainer.innerHTML = '';
  
  // Crear elemento de mesa para Geschenke
  const tableElement = createTableElement(table);
  tableElement.style.position = 'relative';
  tableElement.style.left = 'auto';
  tableElement.style.top = 'auto';
  tableElement.style.transform = 'none';
  tableElement.style.cursor = 'move';
  geschenkeContainer.appendChild(tableElement);
  
  // Añadir event listener para arrastrar desde Optionen al floorPlan
  tableElement.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleMouseDown(e, table.id);
  });
}

// Renderizar FotoBox en el contenedor de opciones
function renderFotoBoxInOptions(): void {
  const fotoBoxContainer = document.getElementById('fotoBoxContainer') as HTMLElement;
  if (!fotoBoxContainer) return;
  
  // Limpiar contenedor
  fotoBoxContainer.innerHTML = '';
  
  // Crear elemento HTML para FotoBox
  const fotoBoxDiv = document.createElement('div');
  fotoBoxDiv.id = 'fotoBoxHtml';
  fotoBoxDiv.style.width = `${FOTOBOX_SIZE}px`;
  fotoBoxDiv.style.height = `${FOTOBOX_SIZE}px`;
  fotoBoxDiv.style.background = '#d0d0d0';
  fotoBoxDiv.style.border = '2px solid #999';
  fotoBoxDiv.style.borderRadius = '4px';
  fotoBoxDiv.style.cursor = 'move';
  fotoBoxDiv.style.position = 'absolute';
  fotoBoxDiv.style.display = 'flex';
  fotoBoxDiv.style.flexDirection = 'column';
  fotoBoxDiv.style.alignItems = 'center';
  fotoBoxDiv.style.justifyContent = 'center';
  fotoBoxDiv.style.userSelect = 'none';
  fotoBoxDiv.style.left = '0';
  fotoBoxDiv.style.top = '0';
  
  // Crear textos
  const fotoText = document.createElement('div');
  fotoText.textContent = 'Foto';
  fotoText.style.fontSize = '10px';
  fotoText.style.fontWeight = 'bold';
  fotoText.style.color = '#666';
  fotoText.style.lineHeight = '1';
  
  const boxText = document.createElement('div');
  boxText.textContent = 'Box';
  boxText.style.fontSize = '10px';
  boxText.style.fontWeight = 'bold';
  boxText.style.color = '#666';
  boxText.style.lineHeight = '1';
  
  fotoBoxDiv.appendChild(fotoText);
  fotoBoxDiv.appendChild(boxText);
  
  // Añadir event listener para drag
  fotoBoxDiv.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDraggableMouseDown(e, 'fotoBox');
  });
  
  fotoBoxContainer.appendChild(fotoBoxDiv);
}

// Calcular posición para Geschenke y FotoBox (ya no necesario, pero mantenemos para compatibilidad)
function repositionGeschenkeAndFotoBox(): void {
  // Geschenke y FotoBox ahora se renderizan en el contenedor de opciones
  // No necesitan reposicionamiento especial
  renderTables();
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
      // Borrar todas las mesas sin mostrar confirm (RESET silencioso)
      // Esto también resetea el contador nextTableId a 1
      tableService.clearAllTables(false);
      
      // Reposicionar Geschenke y FotoBox
      repositionGeschenkeAndFotoBox();
      
      // Recalcular mesas con el número de personas actual
      // Esto creará nuevas mesas con números empezando desde 1
      setTimeout(() => {
        autoConfigureTables();
        // Resetear números de mesas después de crear las nuevas
        tableService.resetTableNumbers();
      }, 50);
    });
  }


  // Inicializar drag & drop para DJ y FotoBox
  initDraggableElements();

  // Inicializar mesa Geschenke si no existe
  tableService.ensureGeschenkeTable();

  // Asegurar que geschenkeContainer esté inicializado
  const geschenkeContainer = document.getElementById('geschenkeContainer') as HTMLElement;
  if (!geschenkeContainer) {
    console.warn('geschenkeContainer no encontrado en el DOM');
  }

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

  // FotoBox ahora se renderiza como elemento HTML en el contenedor de opciones
  // No necesita inicialización aquí
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
    const fotoBoxHtml = document.getElementById('fotoBoxHtml') as HTMLElement | null;
    if (fotoBoxHtml) {
      const rect = fotoBoxHtml.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
    } else {
      dragOffset.x = (e.clientX - svgRect.left) - fotoBoxPosition.x;
      dragOffset.y = (e.clientY - svgRect.top) - fotoBoxPosition.y;
    }
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

  // Botón de rotar (solo si no es Tisch Royal y está dentro de la sala, o si es Geschenke)
  if ((!table.isRoyal && isInsideRoom) || table.isGeschenke) {
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
  if (table.isGeschenke) {
    deleteBtn.title = 'Geschenke löschen (zurück zu Optionen)';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Mover Geschenke de vuelta a Optionen (posición especial fuera de la sala)
      tableService.updateTablePosition(tableId, 0, ROOM_HEIGHT + 300);
      hideRotationControls();
      renderTables();
    });
  } else {
    deleteBtn.title = 'Tisch löschen';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      tableService.deleteTable(tableId);
    });
  }
  controlsDiv.appendChild(deleteBtn);

  const dimensions = TableService.getTableDimensions(table);
  controlsDiv.style.left = `${table.x + dimensions.containerWidth / 2 - 40}px`;
  controlsDiv.style.top = `${table.y - 35}px`;

  floorPlan.appendChild(controlsDiv);
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

  // Botón de borrar DJ (vuelve a Optionen)
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'table-control-btn delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.title = 'DJ löschen (zurück zu Optionen)';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Mover DJ de vuelta a Optionen (posición especial)
    djPosition = { x: 0, y: ROOM_HEIGHT + 400 };
    djRotation = 0;
    const djMixer = document.getElementById('djMixer') as SVGGElement | null;
    if (djMixer) {
      djMixer.setAttribute('transform', `translate(${djPosition.x - 900}, ${djPosition.y - 400}) rotate(${djRotation}, ${djPosition.x}, ${djPosition.y})`);
    }
    StorageService.saveDraggablePositions(djPosition, fotoBoxPosition, djRotation);
    hideRotationControls();
    renderTables();
  });
  controlsDiv.appendChild(deleteBtn);

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
  // Geschenke se renderiza en el contenedor de opciones si no está en el floorPlan
  floorPlanTables.forEach(table => {
    // Verificar una vez más que no sea una mesa del sidebar
    const isSidebarTable = !table.isGeschenke && table.y >= ROOM_HEIGHT && table.y < ROOM_HEIGHT + 200;
    if (!isSidebarTable && !table.isGeschenke) {
      const tableElement = createTableElement(table);
      floorPlan.appendChild(tableElement);
    } else if (table.isGeschenke) {
      // Geschenke: renderizar en floorPlan si está dentro de la sala (y < ROOM_HEIGHT), sino en Optionen
      if (table.y < ROOM_HEIGHT) {
        // Está en el floorPlan
        const tableElement = createTableElement(table);
        floorPlan.appendChild(tableElement);
        // Asegurar que se pueda arrastrar de vuelta a Optionen y mostrar controles al hacer click
        tableElement.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleMouseDown(e, table.id);
        });
        // Mostrar controles al hacer click (no solo drag)
        tableElement.addEventListener('click', (e) => {
          if (!draggedTable && !djWasDragged) {
            e.stopPropagation();
            clearSelection();
            addToSelection(table.id);
            showRotationControls(table.id);
          }
        });
      } else {
        // Está en Optionen o fuera (y >= ROOM_HEIGHT), renderizar en Optionen
        renderGeschenkeInOptions(table);
      }
    } else {
      console.warn('ERROR: Intento de renderizar mesa del sidebar en floor-plan:', table.id, 'y:', table.y);
    }
  });
  
  // Renderizar Geschenke en Optionen si no está en el floorPlan (y >= ROOM_HEIGHT)
  const geschenkeTable = tables.find(t => t.isGeschenke);
  if (geschenkeTable && geschenkeTable.y >= ROOM_HEIGHT) {
    // Está en Optionen o fuera, renderizar en Optionen
    renderGeschenkeInOptions(geschenkeTable);
  }
  
  // Renderizar FotoBox en el contenedor de opciones (si no está en el SVG o está oculto)
  const fotoBoxSvg = document.getElementById('fotoBox') as SVGRectElement | null;
  if (!fotoBoxSvg || fotoBoxSvg.style.display === 'none' || !fotoBoxSvg.parentElement) {
    renderFotoBoxInOptions();
  } else {
    // Si está en el SVG, añadir event listener para arrastrarlo de vuelta a Optionen
    fotoBoxSvg.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleDraggableMouseDown(e, 'fotoBox');
    });
    fotoBoxSvg.style.cursor = 'move';
    fotoBoxSvg.style.pointerEvents = 'all';
  }

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
    
    if (totalSeats === 8) {
      // Para 8 sillas: 3 en cada lado largo (arriba y abajo), 1 en cada lado corto (derecha e izquierda)
      seatsTop = 3;
      seatsBottom = 3;
      seatsRight = 1;
      seatsLeft = 1;
    } else if (totalSeats === 7) {
      // Para 7 sillas: mesa de 8 personas pero con 7 sillas visibles
      // 3 arriba, 3 abajo, 1 a la derecha (o izquierda)
      seatsTop = 3;
      seatsBottom = 3;
      seatsRight = 1;
      seatsLeft = 0;
    } else if (totalSeats <= 6) {
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
      // Para más de 8 sillas: distribución similar
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
    // FotoBox ahora es un elemento HTML, puede moverse dentro de Optionen o al floorPlan
    const fotoBoxHtml = document.getElementById('fotoBoxHtml') as HTMLElement | null;
    if (fotoBoxHtml) {
      const floorPlanRect = floorPlan.getBoundingClientRect();
      const svg = floorPlan.querySelector('svg.floor-plan-svg') as SVGSVGElement | null;
      
      const optionsContainer = document.querySelector('.options-container-right') as HTMLElement;
      const optionsRect = optionsContainer?.getBoundingClientRect();
      
      // Verificar si el mouse está sobre el floorPlan
      if (e.clientX >= floorPlanRect.left && e.clientX <= floorPlanRect.right &&
          e.clientY >= floorPlanRect.top && e.clientY <= floorPlanRect.bottom && svg) {
        // Mover al floorPlan (coordenadas SVG)
        const svgRect = svg.getBoundingClientRect();
        let x = (e.clientX - svgRect.left) - dragOffset.x;
        let y = (e.clientY - svgRect.top) - dragOffset.y;
        
        // Limitar dentro de la sala
        x = Math.max(20, Math.min(ROOM_WIDTH - FOTOBOX_SIZE - 20, x));
        y = Math.max(20, Math.min(ROOM_HEIGHT - FOTOBOX_SIZE - 20, y));
        
        fotoBoxPosition = { x, y };
        // Mover el elemento al floorPlan SVG
        fotoBoxHtml.style.display = 'none'; // Ocultar el HTML
        // Crear o actualizar FotoBox en el SVG
        let fotoBoxSvg = document.getElementById('fotoBox') as SVGRectElement | null;
        if (!fotoBoxSvg) {
          const svgElement = svg;
          fotoBoxSvg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          fotoBoxSvg.id = 'fotoBox';
          fotoBoxSvg.setAttribute('width', FOTOBOX_SIZE.toString());
          fotoBoxSvg.setAttribute('height', FOTOBOX_SIZE.toString());
          fotoBoxSvg.setAttribute('fill', '#d0d0d0');
          fotoBoxSvg.setAttribute('stroke', '#999');
          fotoBoxSvg.setAttribute('stroke-width', '2');
          fotoBoxSvg.setAttribute('rx', '4');
          fotoBoxSvg.style.cursor = 'move';
          svgElement.appendChild(fotoBoxSvg);
          
          const fotoText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          fotoText.id = 'fotoBoxText';
          fotoText.textContent = 'Foto';
          fotoText.setAttribute('x', (x + FOTOBOX_SIZE / 2).toString());
          fotoText.setAttribute('y', (y + FOTOBOX_SIZE / 2 - 5).toString());
          fotoText.setAttribute('text-anchor', 'middle');
          fotoText.setAttribute('font-size', '10');
          fotoText.setAttribute('fill', '#666');
          fotoText.setAttribute('font-weight', 'bold');
          fotoText.setAttribute('pointer-events', 'none');
          svgElement.appendChild(fotoText);
          
          const boxText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          boxText.id = 'fotoBoxText2';
          boxText.textContent = 'Box';
          boxText.setAttribute('x', (x + FOTOBOX_SIZE / 2).toString());
          boxText.setAttribute('y', (y + FOTOBOX_SIZE / 2 + 8).toString());
          boxText.setAttribute('text-anchor', 'middle');
          boxText.setAttribute('font-size', '10');
          boxText.setAttribute('fill', '#666');
          boxText.setAttribute('font-weight', 'bold');
          boxText.setAttribute('pointer-events', 'none');
          svgElement.appendChild(boxText);
        }
        fotoBoxSvg.setAttribute('x', x.toString());
        fotoBoxSvg.setAttribute('y', y.toString());
        const fotoText = document.getElementById('fotoBoxText') as SVGTextElement | null;
        const boxText = document.getElementById('fotoBoxText2') as SVGTextElement | null;
        if (fotoText) {
          fotoText.setAttribute('x', (x + FOTOBOX_SIZE / 2).toString());
          fotoText.setAttribute('y', (y + FOTOBOX_SIZE / 2 - 5).toString());
        }
        if (boxText) {
          boxText.setAttribute('x', (x + FOTOBOX_SIZE / 2).toString());
          boxText.setAttribute('y', (y + FOTOBOX_SIZE / 2 + 8).toString());
        }
        StorageService.saveDraggablePositions(djPosition, fotoBoxPosition, djRotation);
      } else if (optionsRect && e.clientX >= optionsRect.left && e.clientX <= optionsRect.right &&
                 e.clientY >= optionsRect.top && e.clientY <= optionsRect.bottom) {
        // Mover de vuelta a Optionen
        const containerRect = optionsRect;
        let x = e.clientX - containerRect.left - dragOffset.x;
        let y = e.clientY - containerRect.top - dragOffset.y;
        
        // Limitar dentro del contenedor
        x = Math.max(0, Math.min(containerRect.width - FOTOBOX_SIZE, x));
        y = Math.max(0, Math.min(containerRect.height - FOTOBOX_SIZE, y));
        
        fotoBoxHtml.style.left = `${x}px`;
        fotoBoxHtml.style.top = `${y}px`;
        fotoBoxHtml.style.display = 'flex';
        fotoBoxPosition = { x, y };
        // Ocultar SVG si existe
        const fotoBoxSvg = document.getElementById('fotoBox') as SVGRectElement | null;
        if (fotoBoxSvg) {
          fotoBoxSvg.style.display = 'none';
        }
        StorageService.saveDraggablePositions(djPosition, fotoBoxPosition, djRotation);
      } else {
        // Mover dentro de Optionen (si ya está ahí)
        const optionsContainer = fotoBoxHtml.closest('.options-container-right') as HTMLElement;
        if (optionsContainer) {
          const containerRect = optionsContainer.getBoundingClientRect();
          let x = e.clientX - containerRect.left - dragOffset.x;
          let y = e.clientY - containerRect.top - dragOffset.y;
          
          // Limitar dentro del contenedor
          x = Math.max(0, Math.min(containerRect.width - FOTOBOX_SIZE, x));
          y = Math.max(0, Math.min(containerRect.height - FOTOBOX_SIZE, y));
          
          fotoBoxHtml.style.left = `${x}px`;
          fotoBoxHtml.style.top = `${y}px`;
          fotoBoxPosition = { x, y };
          // Ocultar SVG si existe
          const fotoBoxSvg = document.getElementById('fotoBox') as SVGRectElement | null;
          if (fotoBoxSvg) {
            fotoBoxSvg.style.display = 'none';
          }
          StorageService.saveDraggablePositions(djPosition, fotoBoxPosition, djRotation);
        }
      }
    }
  } else if (draggedTable) {
    const table = tableService.getTableById(draggedTable);
    if (!table) return;
    
    // Si Geschenke está siendo arrastrado, verificar si va a Optionen o floorPlan
    if (table.isGeschenke) {
      const geschenkeContainer = document.getElementById('geschenkeContainer') as HTMLElement;
      const existingInOptionen = geschenkeContainer?.querySelector(`[data-id="${draggedTable}"]`);
      const floorPlanRect = floorPlan.getBoundingClientRect();
      const optionsContainer = document.querySelector('.options-container-right') as HTMLElement;
      const optionsRect = optionsContainer?.getBoundingClientRect();
      
      // Verificar si el mouse está sobre el floorPlan
      if (e.clientX >= floorPlanRect.left && e.clientX <= floorPlanRect.right &&
          e.clientY >= floorPlanRect.top && e.clientY <= floorPlanRect.bottom) {
        // Mover al floorPlan
        const x = e.clientX - floorPlanRect.left - dragOffset.x;
        const y = e.clientY - floorPlanRect.top - dragOffset.y;
        tableService.updateTablePosition(draggedTable, x, y);
        return;
      } else if (optionsRect && e.clientX >= optionsRect.left && e.clientX <= optionsRect.right &&
                 e.clientY >= optionsRect.top && e.clientY <= optionsRect.bottom) {
        // Mover a Optionen (posición especial fuera de la sala)
        tableService.updateTablePosition(draggedTable, 0, ROOM_HEIGHT + 300);
        return;
      } else if (existingInOptionen) {
        // Aún en Optionen, no hacer nada
        return;
      }
    }
    
    const rect = floorPlan.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    // Verificar si Geschenke o FotoBox se están moviendo de vuelta a Optionen
    if (table.isGeschenke) {
      const optionsContainer = document.querySelector('.options-container-right') as HTMLElement;
      const optionsRect = optionsContainer?.getBoundingClientRect();
      if (optionsRect && e.clientX >= optionsRect.left && e.clientX <= optionsRect.right &&
          e.clientY >= optionsRect.top && e.clientY <= optionsRect.bottom) {
        // Mover a Optionen
        tableService.updateTablePosition(draggedTable, 0, ROOM_HEIGHT + 300);
        return;
      }
    }

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
function handleMouseUp(_e: MouseEvent): void {
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
  
  // Si Geschenke fue arrastrado desde Optionen al floorPlan, actualizar renderizado
  if (draggedTable) {
    const table = tableService.getTableById(draggedTable);
    if (table && table.isGeschenke) {
      // Forzar re-renderizado para mover Geschenke del contenedor de opciones al floorPlan o viceversa
      renderTables();
    }
    
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
    initialTablePositions.clear();
    
    // Mostrar controles si hay mesas seleccionadas
    if (selectedTables.length > 0) {
      updateSelectionVisual();
    }
  }
  if (draggedElement) {
    // Si FotoBox fue arrastrado, actualizar renderizado
    if (draggedElement === 'fotoBox') {
      renderTables();
    }
    draggedElement = null;
    dragOffset = { x: 0, y: 0 };
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

