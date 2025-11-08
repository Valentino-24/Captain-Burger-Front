import type { IProducto } from "../../../types/IProducto";
import type { ICategoria } from "../../../types/ICategoria";
import { getProductos, crearProducto, actualizarProducto, borrarProducto, getCategorias } from "../../../utils/api";
import { checkAuthUser } from "../../../utils/auth";
import { logoutUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";

let productos: IProducto[] = [];

checkAuthUser("ADMIN", "/src/pages/auth/login/login.html");
// Elementos del DOM
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

const dtoToIProducto = (dto: any): IProducto => {
    return {
        id: dto.id,
        nombre: dto.nombre,
        descripcion: dto.descripcion || '',
        precio: dto.precio ?? 0,
        stock: dto.stock,
        categoriaId: dto.categoriaId ?? null,
        imagenURL: dto.imagenURL ?? '',
        disponible: dto.disponible
    } as IProducto;
};

//Renderizado categorías en el dropdown

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

//Renderizado tabla de productos

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

    // Listeners para ELIMINAR
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

    // Listeners para EDITAR
    document.querySelectorAll('.btn-editar').forEach(boton => {
        boton.addEventListener('click', () => {
            const id = (boton as HTMLElement).dataset.id;
            if (id) {
                handleEditProducto(parseInt(id));
            }
        });
    });
};

// Obtener nombre de categoría por ID

const getCategoriaNombre = (id: number | null) => {
    if (!id) return 'Desconocida';
    const option = categoriaSelect.querySelector(`option[value="${id}"]`) as HTMLOptionElement;
    return option ? option.textContent || 'Desconocida' : 'Desconocida';
};

// Mostrar y ocultar modal

const showModal = (title: string) => {
    modalTitulo.textContent = title;
    modalProducto.style.display = "flex";
};
const hideModal = () => {
    modalProducto.style.display = "none";
    formProducto.reset();
    productoIdInput.value = '';
};

// Traer productos desde el backend

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

// Handler para editar producto

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

// Inicialización

(async () => {
    await renderCategoriasDropdown();
    await cargarProductosDesdeBackend();
})();

// Listeners de eventos UI

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
            await crearProducto(dtoPayload);
        } else {
            const id = parseInt(idString);
            await actualizarProducto(id, dtoPayload);
        }
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

export {};