// src/pages/admin/products/products.ts

// -----------------------------
// IMPORTS
// -----------------------------
// Aquí importamos las interfaces (tipos) y las funciones que llaman al backend.
// Fin de esta sección: importaciones listas, seguimos con el estado y la protección de ruta.
import type { IProducto } from "../../../types/IProducto";
import type { ICategoria } from "../../../types/ICategoria";
import { getProductos, crearProducto, actualizarProducto, borrarProducto, getCategorias } from "../../../utils/api";
import { checkAuthUser } from "../../../utils/auth";
import { logoutUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";
// -----------------------------
// FIN: IMPORTS
// -----------------------------


// -----------------------------
// ESTADO LOCAL Y PROTECCIÓN
// -----------------------------
// `productos` es el array que usaremos para renderizar la tabla. Se llenará desde el backend.
// `checkAuthUser` valida que el usuario esté autenticado y tenga rol ADMIN antes de ejecutar la página.
// Fin de esta sección: estado inicial definido y verificación de permisos hecha.
let productos: IProducto[] = [];

checkAuthUser("ADMIN", "/src/pages/auth/login/login.html");
// -----------------------------
// FIN: ESTADO LOCAL Y PROTECCIÓN
// -----------------------------


// -----------------------------
// SELECCIÓN DE ELEMENTOS DEL DOM
// -----------------------------
// Aquí traemos referencias a elementos del HTML (botones, formulario, inputs, tabla).
// Fin de esta sección: ya tenemos los elementos DOM en variables para manipularlos.
const btnNuevoProducto = document.getElementById("btn-nuevo-producto") as HTMLButtonElement;
const btnCancelar = document.getElementById("btn-cancelar") as HTMLButtonElement;
const btnCerrarModalProducto = document.getElementById("btn-cerrar-modal-producto") as HTMLSpanElement;
const tablaProductosBody = document.getElementById("tabla-productos-body") as HTMLTableSectionElement;
const modalProducto = document.getElementById("modal-producto") as HTMLDivElement;
const formProducto = document.getElementById("form-producto") as HTMLFormElement;
const modalTitulo = document.getElementById("modal-titulo") as HTMLHeadingElement;
const productoIdInput = document.getElementById("producto-id") as HTMLInputElement;
const nombreInput = document.getElementById("nombre") as HTMLInputElement;
const descripcionInput = document.getElementById("descripcion") as HTMLInputElement;
const precioInput = document.getElementById("precio") as HTMLInputElement;
const stockInput = document.getElementById("stock") as HTMLInputElement;
const categoriaSelect = document.getElementById("categoria") as HTMLSelectElement;
const imagenInput = document.getElementById("imagen") as HTMLInputElement;
const disponibleInput = document.getElementById("disponible") as HTMLInputElement;
const buttonLogout = document.getElementById("button_logout") as HTMLButtonElement;
const userName = document.getElementById("user-name") as HTMLSpanElement;

const user = localStorage.getItem("userData");
userName.textContent = user ? JSON.parse(user).nombre : "Admin";
// -----------------------------
// FIN: SELECCIÓN DE ELEMENTOS DEL DOM
// -----------------------------


// -----------------------------
// HELPERS: MAPEOS Y UTILIDADES
// -----------------------------
// Funciones pequeñas que transforman datos o facilitan operaciones reutilizables.
// - dtoToIProducto: convierte lo que viene del backend a la interfaz que maneja el front.
// Fin de esta sección: helpers listos para usar.
const dtoToIProducto = (dto: any): IProducto => {
    return {
        id: dto.id,
        nombre: dto.nombre,
        descripcion: dto.descripcion || '',
        precio: dto.precio ?? 0,
        stock: dto.stock,
        categoriaId: dto.categoriaId ?? null,
        imagenURL: dto.imagenURL ?? '',
        disponible: dto.disponible // campo no persistido por ahora
    } as IProducto;
};
// -----------------------------
// FIN: HELPERS
// -----------------------------


// -----------------------------
// RENDERIZADO: DROPDOWN DE CATEGORÍAS
// -----------------------------
// Carga las categorías desde el backend (o lanza error) y crea <option> dentro del <select>.
// Fin de esta sección: el select de categorías queda poblado con opciones del backend.
const renderCategoriasDropdown = async () => {
    categoriaSelect.innerHTML = '';
    // Intentamos obtener del backend
    const categoriasFromBackend = await getCategorias().catch(() => null);
    const lista = categoriasFromBackend;
    lista.forEach((categoria: ICategoria) => {
        const option = document.createElement('option');
        option.value = categoria.id.toString();
        option.textContent = categoria.nombre;
        categoriaSelect.appendChild(option);
    });
};
// -----------------------------
// FIN: RENDERIZADO CATEGORÍAS
// -----------------------------


// -----------------------------
// RENDERIZADO: TABLA DE PRODUCTOS
// -----------------------------
// Dibuja todas las filas de la tabla a partir del array `productos`.
// También agrega los event listeners para editar y eliminar cada fila.
// Fin de esta sección: tabla poblada y botones conectados a sus handlers.



const renderProductos = () => {
    tablaProductosBody.innerHTML = '';

    productos.forEach(producto => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
        <td>${producto.id}</td>
        <td><img src="${producto.imagenURL}" class="img-product"></td>
        <td>${producto.nombre}</td>
        <td>${producto.descripcion}</td>
        <td>$${producto.precio}</td>
        <td>${getCategoriaNombre(producto.categoriaId)}</td>
        <td>${producto.stock}</td>
        <td>${producto.disponible ? 'Sí' : 'No'}</td>
        <td>
            <button class="btn-editar" data-id="${producto.id}">Editar</button>
            <button class="btn-eliminar" data-id="${producto.id}">Eliminar</button>
        </td>
        `;

        tablaProductosBody.appendChild(tr);
    });

    // Event Listeners para ELIMINAR
    document.querySelectorAll('.btn-eliminar').forEach(boton => {
        boton.addEventListener('click', async () => {
            const id = (boton as HTMLElement).dataset.id;
            if (id && confirm(`¿Estás seguro que querés eliminar el producto con ID ${id}?`)) {
                try {
                    await borrarProducto(parseInt(id));
                    await cargarProductosDesdeBackend();
                } catch (err) {
                    console.error('Error al eliminar producto:', err);
                    alert('No se pudo eliminar el producto');
                }
            }
        });
    });

    // Event Listeners para EDITAR
    document.querySelectorAll('.btn-editar').forEach(boton => {
        boton.addEventListener('click', () => {
            const id = (boton as HTMLElement).dataset.id;
            if (id) {
                handleEditProducto(parseInt(id));
            }
        });
    });
};
// -----------------------------
// FIN: RENDERIZADO TABLA
// -----------------------------


// -----------------------------
// UTILDAD: OBTENER NOMBRE DE CATEGORÍA
// -----------------------------
// Busca en el <select> el <option> con el id dado y devuelve su textContent.
// Fin de esta sección: función utilitaria lista para mostrar el nombre en la tabla.
const getCategoriaNombre = (id: number | null) => {
    if (!id) return 'Desconocida';
    const option = categoriaSelect.querySelector(`option[value="${id}"]`) as HTMLOptionElement;
    return option ? option.textContent || 'Desconocida' : 'Desconocida';
};
// -----------------------------
// FIN: OBTENER NOMBRE DE CATEGORÍA
// -----------------------------


// -----------------------------
// MODAL: MOSTRAR Y OCULTAR
// -----------------------------
// Funciones pequeñas para abrir/cerrar el modal de producto y resetear el form.
// Fin de esta sección: control del modal listo.
const showModal = (title: string) => {
    modalTitulo.textContent = title;
    modalProducto.style.display = "flex";
};
const hideModal = () => {
    modalProducto.style.display = "none";
    formProducto.reset();
    productoIdInput.value = '';
};
// -----------------------------
// FIN: MODAL
// -----------------------------


// -----------------------------
// DATA: CARGAR PRODUCTOS DESDE BACKEND
// -----------------------------
// Hace una petición al backend, mapea los DTOs a `IProducto` y renderiza la tabla.
// Fin de esta sección: productos sincronizados con la BD y mostrados en pantalla.
const cargarProductosDesdeBackend = async () => {
    try {
        const dtos = await getProductos();
        productos = (dtos ?? []).map((d: any) => dtoToIProducto(d));
        renderProductos();
    } catch (err) {
        console.error('Error al cargar productos desde backend:', err);
        alert('No se pudo obtener la lista de productos del servidor. Reintentá más tarde.');
        // En caso de error mostramos tabla vacía
        productos = [];
        renderProductos();
    }
};
// -----------------------------
// FIN: DATA
// -----------------------------


// -----------------------------
// HANDLER: CARGAR DATOS EN EL FORMULARIO PARA EDITAR
// -----------------------------
// Cuando el usuario hace click en "Editar", esta función carga los valores en el modal.
// Fin de esta sección: form listo para que el usuario modifique y guarde.
const handleEditProducto = (id: number) => {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    productoIdInput.value = producto.id.toString();
    nombreInput.value = producto.nombre;
    descripcionInput.value = producto.descripcion;
    precioInput.value = producto.precio.toString();
    stockInput.value = producto.stock?.toString() ?? '0';
    categoriaSelect.value = producto.categoriaId?.toString() ?? '';
    imagenInput.value = producto.imagenURL;
    disponibleInput.checked = producto.disponible;
    showModal('Editar Producto');
};
// -----------------------------
// FIN: HANDLER EDITAR
// -----------------------------


// -----------------------------
// INICIALIZACIÓN (IIFE)
// -----------------------------
// Punto de entrada: cargamos el dropdown de categorías y los productos desde la BD.
// Fin de esta sección: la UI queda poblada al abrir la página.
(async () => {
    await renderCategoriasDropdown();
    await cargarProductosDesdeBackend();
})();
// -----------------------------
// FIN: INICIALIZACIÓN
// -----------------------------


// -----------------------------
// EVENTOS UI: BOTONES Y FORM
// -----------------------------
// Listeners para nuevos productos, cancelar, cerrar modal y envío del formulario.
// Fin de esta sección: la UI está completamente interactiva.
btnNuevoProducto.addEventListener('click', () => {
    formProducto.reset();
    productoIdInput.value = '';
    showModal('Nuevo Producto');
});
btnCancelar.addEventListener('click', hideModal);
btnCerrarModalProducto.addEventListener('click', hideModal);

formProducto.addEventListener('submit', async (event) => {
    event.preventDefault();

    const idString = productoIdInput.value;
    const nombre = nombreInput.value.trim();
    const descripcion = descripcionInput.value.trim();
    const precio = parseFloat(precioInput.value);
    const stock = parseInt(stockInput.value);
    const categoriaId = parseInt(categoriaSelect.value);
    const imagen = imagenInput.value.trim();
    const disponible = disponibleInput.checked;

    if (!nombre || !descripcion || isNaN(precio) || !categoriaId || !imagen) {
        alert("Por favor, completá todos los campos obligatorios.");
        return;
    }

    const dtoPayload = {
        nombre,
        descripcion,
        precio,
        stock,
        categoriaId,
        imagenURL: imagen,
        disponible: disponible
    };

    try {
        if (!idString) {
            // Crear nuevo producto en el backend
            await crearProducto(dtoPayload);
        } else {
            // Actualizar producto existente en el backend
            const id = parseInt(idString);
            await actualizarProducto(id, dtoPayload);
        }
        // Refrescar la lista desde backend y cerrar modal
        await cargarProductosDesdeBackend();
        hideModal();
    } catch (err) {
        console.error('Error al guardar producto:', err);
        alert('Ocurrió un error guardando el producto.');
    }
});
buttonLogout.addEventListener("click", () => {
    logoutUser();
    navigate("/src/pages/auth/login/login.html");
});
// -----------------------------
// FIN: EVENTOS UI
// -----------------------------


export {};
// -----------------------------
// FIN DEL ARCHIVO products.ts
// -----------------------------
