// Estado de la aplicación
let tables = [];
let nextTableId = 1;
let draggedTable = null;
let draggedElement = null; // Para DJ y FotoBox
let dragOffset = { x: 0, y: 0 };
let djPosition = { x: 945, y: 430 };
let fotoBoxPosition = { x: 50, y: 400 }; // Cerca de la esquina inferior izquierda
const fotoBoxSize = 56; // Tamaño del FotoBox (30% más pequeño: 80 * 0.7 = 56)

// Elementos del DOM
const floorPlan = document.getElementById('floorPlan');
const tablesList = document.getElementById('tablesList');
const addTableButtons = document.querySelectorAll('.btn-add-table');
const clearAllBtn = document.getElementById('clearAllBtn');

// Inicialización
function init() {
    // Cargar mesas guardadas del localStorage
    loadTables();
    
    // Event listeners para añadir mesas
    addTableButtons.forEach(button => {
        button.addEventListener('click', () => {
            const seats = parseInt(button.getAttribute('data-seats'));
            addTable(seats, false);
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
            const seats = parseInt(document.getElementById('royalSeats').value) || 4;
            if (seats >= 1 && seats <= 8) {
                addTable(seats, true); // true = Tisch Royal
                royalControls.style.display = 'none';
            }
        });
    }

    // Event listeners para drag & drop
    floorPlan.addEventListener('mousemove', handleMouseMove);
    floorPlan.addEventListener('mouseup', handleMouseUp);
    floorPlan.addEventListener('mouseleave', handleMouseUp);

    // Event listener para borrar todas las mesas
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllTables);
    }

    // Inicializar drag & drop para DJ y FotoBox
    initDraggableElements();

    // Inicializar mesa Geschenke si no existe
    if (!tables.find(t => t.id === 'geschenke-table')) {
        const geschenkeTable = {
            id: 'geschenke-table',
            x: 100,
            y: 20,
            seats: 8,
            isRoyal: false,
            isGeschenke: true,
            tableNumber: 'Geschenke',
            rotation: 0
        };
        tables.push(geschenkeTable);
        saveTables();
    }

    // Renderizar mesas iniciales
    renderTables();
}

// Inicializar elementos arrastrables (DJ y FotoBox)
function initDraggableElements() {
    // Cargar posiciones guardadas
    loadDraggablePositions();
    
    // Aplicar posiciones guardadas y añadir event listeners
    const djMixer = document.getElementById('djMixer');
    const fotoBox = document.getElementById('fotoBox');
    
    if (djMixer) {
        djMixer.setAttribute('transform', `rotate(-45, ${djPosition.x}, ${djPosition.y})`);
        // Añadir event listener a todos los elementos del grupo DJ
        const djElements = djMixer.querySelectorAll('*');
        djElements.forEach(el => {
            el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDraggableMouseDown(e, 'dj');
            });
            el.style.cursor = 'move';
            el.style.pointerEvents = 'all';
        });
        djMixer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDraggableMouseDown(e, 'dj');
        });
        djMixer.style.cursor = 'move';
    }
    
    if (fotoBox) {
        fotoBox.setAttribute('x', fotoBoxPosition.x);
        fotoBox.setAttribute('y', fotoBoxPosition.y);
        const fotoBoxText = document.getElementById('fotoBoxText');
        if (fotoBoxText) {
            fotoBoxText.setAttribute('x', fotoBoxPosition.x + fotoBoxSize / 2);
            fotoBoxText.setAttribute('y', fotoBoxPosition.y + fotoBoxSize / 2 + 4);
        }
        // Añadir event listener usando addEventListener
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
function handleDraggableMouseDown(e, elementType) {
    e.preventDefault();
    e.stopPropagation();
    
    // Detener el drag de mesas si está activo
    if (draggedTable) {
        draggedTable = null;
    }
    
    draggedElement = elementType;
    const rect = floorPlan.getBoundingClientRect();
    const svg = floorPlan.querySelector('svg');
    const svgRect = svg.getBoundingClientRect();
    
    if (elementType === 'dj') {
        // Calcular offset basado en la posición actual del DJ
        dragOffset.x = (e.clientX - svgRect.left) - djPosition.x;
        dragOffset.y = (e.clientY - svgRect.top) - djPosition.y;
    } else if (elementType === 'fotoBox') {
        // Calcular offset basado en la posición actual del FotoBox
        dragOffset.x = (e.clientX - svgRect.left) - fotoBoxPosition.x;
        dragOffset.y = (e.clientY - svgRect.top) - fotoBoxPosition.y;
    }
}

// Añadir una nueva mesa
function addTable(seats = 6, isRoyal = false) {
    let x, y;
    
    if (isRoyal) {
        // Tisch Royal: paralelo a la pared derecha, cerca de ella
        x = 900; // Cerca de la pared derecha (1000 - 100)
        y = 250; // Centro vertical
    } else {
        // Mesa normal: centro de la sala
        x = 500;
        y = 250;
    }
    
    const newTable = {
        id: `table-${nextTableId}`,
        x: x,
        y: y,
        seats: seats,
        isRoyal: isRoyal,
        tableNumber: nextTableId,
        rotation: 0 // Rotación en grados (0, 45, 90, 135, 180, 225, 270, 315)
    };
    
    tables.push(newTable);
    nextTableId++;
    
    saveTables();
    renderTables();
}

// Eliminar una mesa
function deleteTable(id) {
    tables = tables.filter(table => table.id !== id);
    saveTables();
    renderTables();
}

// Borrar todas las mesas con confirmación
function clearAllTables() {
    if (tables.length === 0) {
        return;
    }
    
    if (confirm('Sind Sie sicher, dass Sie alle Tische löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
        tables = [];
        nextTableId = 1;
        saveTables();
        renderTables();
    }
}

// Actualizar posición de una mesa
function updateTablePosition(id, x, y) {
    const table = tables.find(t => t.id === id);
    if (table) {
        if (table.isGeschenke) {
            // Mesa Geschenke: siempre pegada a la pared superior, solo se mueve horizontalmente
            // Dentro de la sala (considerando el tamaño de la mesa)
            const minX = 20;
            const maxX = 1000 - 61 - 20; // Mesa de 61cm (igual que 8 personas), dentro de la sala
            
            table.x = Math.max(minX, Math.min(maxX, x));
            table.y = 20; // Y fijo en la pared superior (dentro de la sala)
        } else if (table.isRoyal) {
            // Tisch Royal: siempre paralelo a la pared derecha, solo se mueve verticalmente
            // Mantener X cerca de la pared derecha (1000 - margen - ancho de mesa con sillas)
            // Usar las mismas dimensiones que las demás mesas
            const royalTableWidth = table.seats === 6 ? 55 : 61; // Mismas dimensiones que mesas normales
            const royalContainerWidth = royalTableWidth + 12 + 4; // Mesa + silla + distancia
            const minX = 1000 - royalContainerWidth - 20; // Cerca de la pared derecha
            const minY = 20;
            const maxY = 500 - 33 - 20; // Altura de mesa (33cm)
            
            table.x = minX; // X fijo cerca de la pared derecha
            table.y = Math.max(minY, Math.min(maxY, y)); // Solo Y se puede mover
        } else {
            // Mesas normales: movimiento libre
            // Limitar dentro de los bounds del plano (considerando el tamaño de mesa + sillas)
            // Usamos el tamaño máximo (mesa de 8 personas) para los límites
            // Sala: 1000cm x 500cm (escala 1px = 1cm)
            const minX = 20;
            const minY = 20;
            const maxX = 1000 - 85; // Mesa de 8 personas (61cm) + sillas (12*2 = 24cm)
            const maxY = 500 - 57; // Mesa (33cm) + sillas (12*2 = 24cm)

            table.x = Math.max(minX, Math.min(maxX, x));
            table.y = Math.max(minY, Math.min(maxY, y));
        }
        
        saveTables();
        renderTables();
    }
}

// Rotar una mesa 45 grados
function rotateTable(id) {
    const table = tables.find(t => t.id === id);
    if (table) {
        // Rotar 45 grados (0, 45, 90, 135, 180, 225, 270, 315)
        table.rotation = (table.rotation + 45) % 360;
        saveTables();
        renderTables();
    }
}

// Renderizar todas las mesas
function renderTables() {
    // Limpiar mesas existentes del plano
    const existingTables = floorPlan.querySelectorAll('.table');
    existingTables.forEach(table => table.remove());

    // Renderizar mesas en el plano
    tables.forEach(table => {
        const tableElement = createTableElement(table);
        floorPlan.appendChild(tableElement);
    });

    // Renderizar lista de mesas
    renderTablesList();
}

// Crear elemento DOM para una mesa
function createTableElement(table) {
    const tableDiv = document.createElement('div');
    tableDiv.className = 'table';
    tableDiv.setAttribute('data-id', table.id);
    tableDiv.style.left = `${table.x}px`;
    tableDiv.style.top = `${table.y}px`;
    
    // Aplicar rotación
    if (table.rotation && table.rotation !== 0) {
        tableDiv.style.transform = `rotate(${table.rotation}deg)`;
        tableDiv.style.transformOrigin = 'center center';
    }

    const numSeats = table.seats;
    const isRoyal = table.isRoyal || false;
    const isGeschenke = table.isGeschenke || false;
    
    // Tamaños de mesa según número de personas (escala 1px = 1cm, aumentado 10%)
    // Ancho: 33cm (todas, 10% más), Largo: 22cm (2 personas), 55cm (6 personas), 61cm (8 personas)
    // Para Tisch Royal, el tamaño se calcula según el número de personas (hasta 8)
    // Geschenke tiene el tamaño de una mesa de 8 personas (61x33)
    let tableWidth, tableHeight, containerWidth, containerHeight, containerCenterX, containerCenterY;
    
    if (isGeschenke) {
        // Mesa Geschenke: tamaño igual a mesa de 8 personas, sin sillas
        tableWidth = 61;
        tableHeight = 33;
        containerWidth = 61;
        containerHeight = 33;
    } else if (isRoyal) {
        // Tisch Royal: mismas dimensiones que las demás mesas según número de personas
        if (numSeats === 6) {
            tableWidth = 55;  // 55 cm (largo, igual que mesa normal de 6 personas)
            tableHeight = 33;  // 33 cm (ancho, igual que mesa normal)
            containerWidth = 55 + 12 + 4; // Mesa + silla + distancia (sillas solo a la derecha)
            containerHeight = 33;
        } else if (numSeats === 8) {
            tableWidth = 61;  // 61 cm (largo, igual que mesa normal de 8 personas)
            tableHeight = 33;  // 33 cm (ancho, igual que mesa normal)
            containerWidth = 61 + 12 + 4; // Mesa + silla + distancia (sillas solo a la derecha)
            containerHeight = 33;
        } else {
            // Para otros números de personas, usar tamaño de 8 personas por defecto
            tableWidth = 61;
            tableHeight = 33;
            containerWidth = 61 + 12 + 4;
            containerHeight = 33;
        }
    } else {
        // Mesas normales
        if (numSeats === 6) {
            tableWidth = 55;  // 55 cm (largo, 10% más de 50)
            tableHeight = 33;  // 33 cm (ancho, 10% más de 30)
            containerWidth = 79; // Mesa + sillas (55 + 12*2)
            containerHeight = 57; // Mesa + sillas (33 + 12*2)
        } else if (numSeats === 8) {
            tableWidth = 61;  // 61 cm (largo, 10% más de 55, redondeado)
            tableHeight = 33;  // 33 cm (ancho, 10% más de 30)
            containerWidth = 85; // Mesa + sillas (61 + 12*2)
            containerHeight = 57; // Mesa + sillas (33 + 12*2)
        }
    }
    
    containerCenterX = containerWidth / 2;
    containerCenterY = containerHeight / 2;
    
    // Contenedor para la mesa y las sillas
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    tableContainer.style.width = `${containerWidth}px`;
    tableContainer.style.height = `${containerHeight}px`;

    // Crear sillas alrededor de la mesa rectangular
    const chairsContainer = document.createElement('div');
    chairsContainer.className = 'chairs-container';
    
    const chairDistance = 4; // Distancia desde el borde de la mesa (4cm, reducido 50% más)
    const chairSize = 12; // Tamaño de cada silla (12cm, 50% de 23cm)
    
    if (isGeschenke) {
        // Mesa Geschenke: sin sillas
    } else if (isRoyal) {
        // Tisch Royal: sillas solo en el lado derecho (que da a la pared derecha)
        // Distribuir todas las sillas verticalmente a lo largo del lado derecho
        for (let i = 0; i < numSeats; i++) {
            const offset = (i + 1) * (tableHeight / (numSeats + 1)) - tableHeight / 2;
            const chair = document.createElement('div');
            chair.className = 'chair';
            chair.style.left = `${containerCenterX + tableWidth/2 + chairDistance - chairSize/2}px`;
            chair.style.top = `${containerCenterY + offset - chairSize/2}px`;
            chairsContainer.appendChild(chair);
        }
    } else {
        // Mesas normales: distribución estándar
        // - 6 personas: 2 arriba, 1 derecha, 2 abajo, 1 izquierda
        // - 8 personas: 3 arriba, 1 derecha, 3 abajo, 1 izquierda
        
        let seatsTop = 0, seatsBottom = 0, seatsRight = 0, seatsLeft = 0;
        
        if (numSeats === 6) {
            seatsTop = 2;
            seatsBottom = 2;
            seatsRight = 1;
            seatsLeft = 1;
        } else if (numSeats === 8) {
            seatsTop = 3;
            seatsBottom = 3;
            seatsRight = 1;
            seatsLeft = 1;
        }
        
        // Lado superior (arriba) - distribuir sillas horizontalmente
        for (let i = 0; i < seatsTop; i++) {
            const offset = (i + 1) * (tableWidth / (seatsTop + 1)) - tableWidth / 2;
            const chair = document.createElement('div');
            chair.className = 'chair';
            chair.style.left = `${containerCenterX + offset - chairSize/2}px`;
            chair.style.top = `${containerCenterY - tableHeight/2 - chairDistance - chairSize/2}px`;
            chairsContainer.appendChild(chair);
        }
        
        // Lado derecho - 1 silla centrada verticalmente
        if (seatsRight > 0) {
            const chair = document.createElement('div');
            chair.className = 'chair';
            chair.style.left = `${containerCenterX + tableWidth/2 + chairDistance - chairSize/2}px`;
            chair.style.top = `${containerCenterY - chairSize/2}px`;
            chairsContainer.appendChild(chair);
        }
        
        // Lado inferior (abajo) - distribuir sillas horizontalmente
        for (let i = 0; i < seatsBottom; i++) {
            const offset = (i + 1) * (tableWidth / (seatsBottom + 1)) - tableWidth / 2;
            const chair = document.createElement('div');
            chair.className = 'chair';
            chair.style.left = `${containerCenterX - offset - chairSize/2}px`;
            chair.style.top = `${containerCenterY + tableHeight/2 + chairDistance - chairSize/2}px`;
            chairsContainer.appendChild(chair);
        }
        
        // Lado izquierdo - 1 silla centrada verticalmente
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
    // Mostrar número de mesa en lugar de número de personas
    // Para Geschenke, mostrar "Geschenke"
    if (isGeschenke) {
        seats.textContent = 'Geschenke';
    } else {
        seats.textContent = table.tableNumber || table.id.replace('table-', '');
    }
    circle.appendChild(seats);

    tableContainer.appendChild(chairsContainer);
    tableContainer.appendChild(circle);

    tableDiv.appendChild(tableContainer);

    // Event listener para iniciar drag
    tableDiv.addEventListener('mousedown', (e) => handleMouseDown(e, table.id));

    return tableDiv;
}

// Renderizar lista de mesas en el sidebar
function renderTablesList() {
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
        // Para Geschenke, mostrar "Geschenke" en lugar de "Tisch geschenke-table"
        if (table.isGeschenke) {
            label.textContent = 'Geschenke';
        } else {
            label.textContent = `Tisch ${table.id.replace('table-', '')}`;
        }

        const seats = document.createElement('span');
        seats.className = 'table-item-seats';
        // Para Geschenke, no mostrar número de personas
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
        deleteBtn.addEventListener('click', () => deleteTable(table.id));

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
function handleMouseDown(e, tableId) {
    e.preventDefault();
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const rect = floorPlan.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - table.x;
    const offsetY = e.clientY - rect.top - table.y;

    draggedTable = tableId;
    dragOffset = { x: offsetX, y: offsetY };

    // Añadir clase dragging
    const tableElement = floorPlan.querySelector(`[data-id="${tableId}"]`);
    if (tableElement) {
        tableElement.classList.add('dragging');
    }
}

// Manejar movimiento durante drag
function handleMouseMove(e) {
    if (!draggedElement && !draggedTable) return;
    
    const svg = floorPlan.querySelector('svg');
    if (!svg) return;
    
    const svgRect = svg.getBoundingClientRect();
    
    if (draggedElement === 'dj') {
        let x = (e.clientX - svgRect.left) - dragOffset.x;
        let y = (e.clientY - svgRect.top) - dragOffset.y;
        
        // Limitar dentro de los bounds
        x = Math.max(50, Math.min(950, x));
        y = Math.max(50, Math.min(450, y));
        
        djPosition = { x, y };
        const djMixer = document.getElementById('djMixer');
        if (djMixer) {
            djMixer.setAttribute('transform', `rotate(-45, ${x}, ${y})`);
        }
        saveDraggablePositions();
    } else if (draggedElement === 'fotoBox') {
        let x = (e.clientX - svgRect.left) - dragOffset.x;
        let y = (e.clientY - svgRect.top) - dragOffset.y;
        
        // Limitar dentro de los bounds (considerando el tamaño del FotoBox 56x56)
        x = Math.max(20, Math.min(1000 - fotoBoxSize - 20, x));
        y = Math.max(20, Math.min(500 - fotoBoxSize - 20, y));
        
        fotoBoxPosition = { x, y };
        const fotoBox = document.getElementById('fotoBox');
        const fotoBoxText = document.getElementById('fotoBoxText');
        if (fotoBox) {
            fotoBox.setAttribute('x', x);
            fotoBox.setAttribute('y', y);
            // Mover también el texto
            if (fotoBoxText) {
                fotoBoxText.setAttribute('x', x + fotoBoxSize / 2);
                fotoBoxText.setAttribute('y', y + fotoBoxSize / 2 + 4);
            }
        }
        saveDraggablePositions();
    } else if (draggedTable) {
        const rect = floorPlan.getBoundingClientRect();
        let x = e.clientX - rect.left - dragOffset.x;
        let y = e.clientY - rect.top - dragOffset.y;

        updateTablePosition(draggedTable, x, y);
    }
}

// Manejar fin de drag
function handleMouseUp() {
    if (draggedTable) {
        const tableElement = floorPlan.querySelector(`[data-id="${draggedTable}"]`);
        if (tableElement) {
            tableElement.classList.remove('dragging');
        }
        draggedTable = null;
    }
    if (draggedElement) {
        draggedElement = null;
    }
}

// Guardar mesas en localStorage
function saveTables() {
    try {
        localStorage.setItem('sala-tables', JSON.stringify(tables));
        localStorage.setItem('sala-next-id', nextTableId.toString());
    } catch (e) {
        console.warn('No se pudo guardar en localStorage:', e);
    }
}

// Cargar mesas de localStorage
function loadTables() {
    try {
        const savedTables = localStorage.getItem('sala-tables');
        const savedNextId = localStorage.getItem('sala-next-id');
        
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
            nextTableId = parseInt(savedNextId, 10);
        }
    } catch (e) {
        console.warn('No se pudo cargar de localStorage:', e);
    }
}

// Guardar posiciones de elementos arrastrables
function saveDraggablePositions() {
    try {
        localStorage.setItem('sala-dj-position', JSON.stringify(djPosition));
        localStorage.setItem('sala-fotobox-position', JSON.stringify(fotoBoxPosition));
    } catch (e) {
        console.warn('No se pudo guardar posiciones en localStorage:', e);
    }
}

// Cargar posiciones de elementos arrastrables
function loadDraggablePositions() {
    try {
        const savedDjPos = localStorage.getItem('sala-dj-position');
        const savedFotoBoxPos = localStorage.getItem('sala-fotobox-position');
        
        if (savedDjPos) {
            djPosition = JSON.parse(savedDjPos);
        }
        
        if (savedFotoBoxPos) {
            fotoBoxPosition = JSON.parse(savedFotoBoxPos);
        }
    } catch (e) {
        console.warn('No se pudo cargar posiciones de localStorage:', e);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

