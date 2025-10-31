// IMPORTAMOS LOS MOLDES
import type { IProducto } from "../../../types/IProducto";
import type { ICategoria } from "../../../types/ICategoria";

// NUESTRAS "BASES DE DATOS FALSAS" (SIMULADAS)

// BD Falsa de Categorías (para rellenar el <select>)
// (En un sistema real, esto vendría de un fetch a /api/categorias)
const categorias: ICategoria[] = [
    { id: 1, nombre: "Hamburguesas", descripcion: "", imagen: "" },
    { id: 2, nombre: "Pizzas", descripcion: "", imagen: "" },
    { id: 3, nombre: "Papas", descripcion: "", imagen: "" }
];

// BD Falsa de Productos
let productos: IProducto[] = [
    {
        id: 101,
        nombre: "Burger Clásica",
        descripcion: "Medallón 120g, cheddar, lechuga y tomate.",
        precio: 8500,
        stock: 50,
        categoriaId: 1,
        imagen: "url-burger-clasica.jpg",
        disponible: true
    },
    {
        id: 102,
        nombre: "Pizza Muzzarella",
        descripcion: "Salasa de tomate, muzzarella y orégano",
        precio: 11000,
        stock: 30,
        categoriaId: 2,
        imagen: "url-pizza-muzzarella.jpg",
        disponible: true
    }
];

// SELECCIÓN DE ELEMENTOS DEL DOM

// Botones
const btnNuevoProducto = document.getElementById("btn-nuevo-producto") as HTMLButtonElement;
const btnCancelar = document.getElementById("btn-cancelar") as HTMLButtonElement;
const btnCerrarModalProducto = document.getElementById("btn-cerrar-modal-producto") as HTMLSpanElement;

// Tabla
const tablaProductosBody = document.getElementById("tabla-productos-body") as HTMLTableSectionElement;

// Modal y Formulario
const modalProducto = document.getElementById("modal-producto") as HTMLDivElement;
const formProducto = document.getElementById("form-producto") as HTMLFormElement;
const modalTitulo = document.getElementById("modal-titulo") as HTMLHeadingElement;

// Campos del Formulario
const productoIdInput = document.getElementById("producto-id") as HTMLInputElement;
const nombreInput = document.getElementById("nombre") as HTMLInputElement;
const descripcionInput = document.getElementById("descripcion") as HTMLInputElement;
const precioInput = document.getElementById("precio") as HTMLInputElement;
const stockInput = document.getElementById("stock") as HTMLInputElement;
const categoriaSelect = document.getElementById("categoria") as HTMLSelectElement;
const imagenInput = document.getElementById("imagen") as HTMLInputElement;
const disponibleInput = document.getElementById("disponible") as HTMLInputElement;

// (Aquí irá toda la lógica del CRUD)

// Rellena el <select> de categorías en el formulario.
// Lee el array 'categorias' y crea un <option> por cada una.
const renderCategoriasDropdown = () => {

    categorias.forEach(categoria => {

        const option = document.createElement('option');
        option.value = categoria.id.toString();
        option.textContent = categoria.nombre;
        categoriaSelect.appendChild(option);
    });
};

// Busca el nombre de una categoría usando su ID.
const getCategoriaNombre = (id: number): string => {
    const categoria = categorias.find(cat => cat.id === id);
    return categoria ? categoria.nombre : "Desconocida";
};

// Dibuja la tabla de productos en el HTML.
// Lee el array 'productos' y crea una fila <tr> por cada uno.
const renderProductos = () => {
    tablaProductosBody.innerHTML = '';

    productos.forEach(producto => {

        const tr = document.createElement('tr');

        tr.innerHTML = `
        <td>${producto.id}</td>
        <td>${producto.nombre}</td>
        <td>$${producto.precio}</td>
        <td>${producto.stock}</td>
        <td>${getCategoriaNombre(producto.categoriaId)}</td>
        <td>${producto.disponible ? 'Sí' : 'No'}</td>
        <td>
            <button class="btn-editar" data-id="${producto.id}">Editar</button>
            <button class="btn-eliminar" data-id="${producto.id}">Eliminar</button>
        </td>
        `;

        tablaProductosBody.appendChild(tr);
    });

    // Agregamos Event Listeners a los botones de ELIMINAR
    const botonesEliminar = document.querySelectorAll('.btn-eliminar');

    botonesEliminar.forEach(boton => {
        boton.addEventListener('click', () => {

            const id = (boton as HTMLElement).dataset.id;
            if (id) {
                handleDeleteProducto(parseInt(id));
            }
        });
    });

    // Agregamos Event Listeners a los botones de EDITAR
    const botonesEditar = document.querySelectorAll('.btn-editar');

    botonesEditar.forEach(boton => {
        boton.addEventListener('click', () => {

            const id = (boton as HTMLElement).dataset.id;
            if (id) {
                handleEditProducto(parseInt(id));
            }
        });
    });

};

// Muestra el modal de formulario de producto.
const showModal = (title: string) => {
    modalTitulo.textContent = title;
    modalProducto.classList.remove('hidden');
};

// Oculta el modal de formulario de producto.
const hideModal = () => {
    modalProducto.classList.add('hidden');
    formProducto.reset();
    productoIdInput.value = '';
}

// Maneja la lógica para eliminar un producto.
const handleDeleteProducto = (id: number) => {

    if (confirm(`¿Estás seguro que querés eliminar el producto con ID ${id}?`)) {

        // Filtramos el array: nos quedamos con todos MENOS el que tiene ese ID.
        productos = productos.filter(producto => producto.id !== id);

        // 3. Volvemos a "dibujar" la tabla (que ahora tiene un ítem menos)
        renderProductos();
    }
};

// Maneja la lógica para cargar los datos de un producto en el modal.
const handleEditProducto = (id: number) => {

    // Buscamos el producto en nuestra "base de datos falsa"
    const producto = productos.find(p => p.id === id);

    // Si no lo encontramos, no hacemos nada
    if (!producto) return;

    // Rellenamos el formulario con los datos del producto
    productoIdInput.value = producto.id.toString(); // Guardamos el ID en el campo oculto
    nombreInput.value = producto.nombre;
    descripcionInput.value = producto.descripcion;
    precioInput.value = producto.precio.toString();
    stockInput.value = producto.stock.toString();
    categoriaSelect.value = producto.categoriaId.toString();
    imagenInput.value = producto.imagen;
    disponibleInput.checked = producto.disponible;

    // Mostramos el modal con el título "Editar Producto"
    showModal('Editar Producto');
};


// --- INICIO DE LA APP ---

// 1. Al cargar la página, llenamos el dropdown y la tabla
renderCategoriasDropdown();
renderProductos();

// 2. Al hacer clic en "Nuevo Producto"
btnNuevoProducto.addEventListener('click', () => {
    formProducto.reset();
    productoIdInput.value = '';
    showModal('Nuevo Producto');
});

// 3. Al hacer clic en "Cancelar"
btnCancelar.addEventListener('click', () => {
    hideModal();
});

// 3b. Al hacer clic en la "X" del modal
btnCerrarModalProducto.addEventListener('click', () => {
    hideModal();
});

// 4. Al ENVIAR el formulario (Crear o Editar)
formProducto.addEventListener('submit', (event) => {
    event.preventDefault();

    // Obtenemos los valores de los inputs
    const idString = productoIdInput.value;
    const nombre = nombreInput.value;
    const descripcion = descripcionInput.value;

    // Convertimos precio y stock a NÚMERO
    const precio = parseFloat(precioInput.value);
    const stock = parseInt(stockInput.value);

    // Obtenemos el ID de la categoría (que es el 'value' del <select>)
    const categoriaId = parseInt(categoriaSelect.value);
    const imagen = imagenInput.value;

    // Para un checkbox, se usa '.checked' (devuelve true o false)
    const disponible = disponibleInput.checked;

    // Validamos que los campos no estén vacíos
    if (!nombre || !descripcion || !precioInput.value || !stockInput.value || !categoriaId || !imagen) {
        alert("Por favor, completá todos los campos.");
        return;
    }

    // === LÓGICA DEL CRUD ===

    if (!idString) {

        // 1. Creamos el nuevo objeto Producto
        const nuevoProducto: IProducto = {
            id: Date.now(),
            nombre: nombre,
            descripcion: descripcion,
            precio: precio,
            stock: stock,
            categoriaId: categoriaId,
            imagen: imagen,
            disponible: disponible
        };

        // 2. Agregamos el producto a nuestra "base de datos falsa"
        productos.push(nuevoProducto);

        console.log('Producto creado', productos);

    } else {

        // Si el 'id' SÍ EXISTE, estamos EDITANDO

        // 1. Convertimos el ID de string a número
        const id = parseInt(idString);

        // 2. Buscamos el producto en nuestro array
        const productoAEditar = productos.find(p => p.id === id);

        // 3. Si lo encontramos, actualizamos sus datos
        if (productoAEditar) {
            productoAEditar.nombre = nombre;
            productoAEditar.descripcion = descripcion;
            productoAEditar.precio = precio;
            productoAEditar.stock = stock;
            productoAEditar.categoriaId = categoriaId;
            productoAEditar.imagen = imagen;
            productoAEditar.disponible = disponible;
            console.log('Producto editado:', productos);
        }
    }

    // 3. Volvemos a "dibujar" la tabla con los datos actualizados
    renderProductos();

    // 4. Cerramos el modal
    hideModal();

});

// El 'export {}' para que no choquen las variables
export {};