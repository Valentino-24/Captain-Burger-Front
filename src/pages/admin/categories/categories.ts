import type { ICategoria } from "../../../types/ICategoria";

let categorias: ICategoria[] = [
    {
        id: 1,
        nombre: "Hamburguesas",
        descripcion: "Las mejores hamburguesas artesanales.",
        imagen: "url-de-imagen-burger.jpg"
    },
    {
        id: 2,
        nombre: "Pizzas",
        descripcion: "Pizzas a la pidra con muzzarella de calidad.",
        imagen: "url-de-imagen-pizza.jpg"
    }
];

// Botones Principales
const btnNuevaCategoria = document.getElementById("btn-nueva-categoria") as HTMLButtonElement;
const btnCancelar = document.getElementById("btn-cancelar") as HTMLButtonElement;
const btnCerrarModal = document.getElementById("btn-cerrar-modal") as HTMLSpanElement;

// Tabla
const tablaCategoriasBody = document.getElementById("tabla-categorias-body") as HTMLTableSectionElement;

// Modal y Formulario
const modalCategoria = document.getElementById("modal-categoria") as HTMLDivElement;
const formCategoria = document.getElementById("form-categoria") as HTMLFormElement;
const modalTitulo = document.getElementById("modal-titulo") as HTMLHeadingElement;

// Campos del Formulario
const categoriaIdInput = document.getElementById("categoria-id") as HTMLInputElement;
const nombreInput = document.getElementById("nombre") as HTMLInputElement;
const descripcionInput = document.getElementById("descripcion") as HTMLInputElement;
const imagenInput = document.getElementById("imagen") as HTMLInputElement;

// (Aquí irá toda la lógica del CRUD)

/**
 * Dibuja la tabla de categorías en el HTML.
 * Lee el array 'categorias' y crea una fila <tr> por cada una.
 */
const renderCategorias = () => {

    tablaCategoriasBody.innerHTML = '';

    categorias.forEach(categoria => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
        <td>${categoria.id}</td>
        <td>${categoria.nombre}</td>
        <td>${categoria.descripcion}</td>
        <td>
            <button class="btn-editar" data-id="${categoria.id}">Editar</button>
            <button class="btn-eliminar" data-id="${categoria.id}">Eliminar</button>
        </td>
        `;

        tablaCategoriasBody.appendChild(tr);
    });

    // Agregamos Event Listeners a los botones de ELIMINAR
    const botonesEliminar = document.querySelectorAll('.btn-eliminar');

    botonesEliminar.forEach(boton => {
        boton.addEventListener('click', () => {
            const id = (boton as HTMLElement).dataset.id;

            if (id) {
                handleDelete(parseInt(id));
            }
        });
    });

    // Agregamos Event Listeners a los botones de EDITAR
    const botonesEditar = document.querySelectorAll('.btn-editar');

    botonesEditar.forEach(boton => {
        boton.addEventListener('click', () => {
            const id = (boton as HTMLElement).dataset.id;

            if (id) {
                handleEdit(parseInt(id));
            }
        });
    });
};

const showModal = (title: string) => {
    modalTitulo.textContent = title;
    modalCategoria.classList.remove('hidden');
};

const hideModal = () => {
    modalCategoria.classList.add('hidden');
    formCategoria.reset();
    categoriaIdInput.value = '';
};

// Maneja la lógica para eliminar una categoría.

const handleDelete = (id: number) => {
    if (confirm(`¿Estás seguro que querés eliminar la categoría con ID ${id}?`)) {

        categorias = categorias.filter(categoria => categoria.id !== id);

        renderCategorias();
    }
};

// Maneja la lógica para cargar los datos de una categoría en el modal.

const handleEdit = (id: number) => {

    // 1. Buscamos la categoría en nuestra "base de datos falsa"
    const categoria = categorias.find(cat => cat.id === id);

    // Si no la encontramos (por si acaso), no hacemos nada
    if (!categoria) return;

    // 2. Rellenamos el formulario con los datos de la categoría
    categoriaIdInput.value = categoria.id.toString(); // Guardamos el ID en el campo oculto
    nombreInput.value = categoria.nombre;
    descripcionInput.value = categoria.descripcion;
    imagenInput.value = categoria.imagen;

    // 3. Mostramos el modal con el título "Editar Categoría"
    showModal('Editar Categoría');
};

// --- INICIO DE LA APP ---

// 1. Al cargar la página, dibujamos la tabla
renderCategorias();

// 2. Al hacer clic en "Nueva Categoría"
btnNuevaCategoria.addEventListener('click', () => {
    showModal('Nueva Categoría');
});

// 3. Al hacer clic en "Cancelar"
btnCancelar.addEventListener('click', () => {
    hideModal();
});

// 3b. Al hacer clic en la "X" del modal
btnCerrarModal.addEventListener('click', () => {
    hideModal();
});

// 4. Al ENVIAR el formulario (Crear o Editar)
formCategoria.addEventListener('submit', (event) => {
    event.preventDefault();

    const idString = categoriaIdInput.value;
    const nombre = nombreInput.value;
    const descripcion = descripcionInput.value;
    const imagen = imagenInput.value;

    if (!nombre || !descripcion || !imagen) {
        alert("Por favor, completá todos los campos.");
        return;
    }

    // === LÓGICA DEL CRUD ===
    // Por ahora, solo manejamos el caso de "Crear".
    // Si el 'id' oculto está vacío, es una categoría NUEVA.

    if (!idString) {
        const nuevaCategoria: ICategoria = {
            id: Date.now(),
            nombre: nombre,
            descripcion: descripcion,
            imagen: imagen,
        };

        categorias.push(nuevaCategoria);

        console.log('Categoría creada:', categorias);

    } else {
        // (Aquí irá la lógica de "Editar")
        // Si el 'id' SÍ EXISTE, estamos EDITANDO
        
        // 1. Convertimos el ID de string a número
        const id = parseInt(idString);

        // 2. Buscamos la categoría en nuestro array
        const categoriaAEditar = categorias.find(cat => cat.id === id);

        // 3. Si la encontramos, actualizamos sus datos
        if (categoriaAEditar) {
            categoriaAEditar.nombre = nombre;
            categoriaAEditar.descripcion = descripcion;
            categoriaAEditar.imagen = imagen;
            console.log('Categoría editada', categorias);
        }
    }

    renderCategorias();

    hideModal();
});

export {};