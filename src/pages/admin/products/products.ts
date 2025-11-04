// src/pages/admin/products/products.ts
import type { IProducto } from "../../../types/IProducto";
import type { ICategoria } from "../../../types/ICategoria";
import { getProductos, crearProducto, actualizarProducto, borrarProducto, getCategorias } from "../../../utils/api";

// Estado local (se llenará desde el backend)
let productos: IProducto[] = [];

// SELECCIÓN DE ELEMENTOS DEL DOM
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

// Helper: mapeo DTO backend <-> IProducto front
const dtoToIProducto = (dto: any): IProducto => {
    return {
        id: dto.id,
        nombre: dto.nombre,
        descripcion: dto.descripcion || '',
        precio: dto.precio ?? 0,
        stock: dto.stock,
        categoriaId: dto.categoriaId ?? null,
        imagen: dto.imagenURL ?? '',
        disponible: true // no se persiste por ahora
    } as IProducto;
};

// Rellena el <select> de categorías (intenta backend, si falla usa fallback)
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

// Dibuja la tabla de productos en el HTML.
const renderProductos = () => {
    tablaProductosBody.innerHTML = '';

    productos.forEach(producto => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
        <td>${producto.id}</td>
        <td><img src="${producto.imagen}" class="img-product"></td>
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

    // Event Listeners
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

    document.querySelectorAll('.btn-editar').forEach(boton => {
        boton.addEventListener('click', () => {
            const id = (boton as HTMLElement).dataset.id;
            if (id) {
                handleEditProducto(parseInt(id));
            }
        });
    });
};

// Busca el nombre de una categoría usando su ID (usa el select actual)
const getCategoriaNombre = (id: number | null) => {
    if (!id) return 'Desconocida';
    const option = categoriaSelect.querySelector(`option[value="${id}"]`) as HTMLOptionElement;
    return option ? option.textContent || 'Desconocida' : 'Desconocida';
};

// Mostrar / ocultar modal
const showModal = (title: string) => {
    modalTitulo.textContent = title;
    modalProducto.classList.remove('hidden');
};
const hideModal = () => {
    modalProducto.classList.add('hidden');
    formProducto.reset();
    productoIdInput.value = '';
};

// Cargar datos desde backend y popular productos[]
const cargarProductosDesdeBackend = async () => {
    try {
        const dtos = await getProductos();
        productos = (dtos ?? []).map((d: any) => dtoToIProducto(d));
        renderProductos();
    } catch (err) {
        console.error('Error al cargar productos desde backend:', err);
        alert('No se pudo obtener la lista de productos del servidor. Reintentá más tarde.');
        // opcional: dejar productos vacíos o mantener fallback local
        productos = [];
        renderProductos();
    }
};

// Manejo editar (carga producto en form)
const handleEditProducto = (id: number) => {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    productoIdInput.value = producto.id.toString();
    nombreInput.value = producto.nombre;
    descripcionInput.value = producto.descripcion;
    precioInput.value = producto.precio.toString();
    stockInput.value = producto.stock?.toString() ?? '0';
    categoriaSelect.value = producto.categoriaId?.toString() ?? '';
    imagenInput.value = producto.imagen;
    disponibleInput.checked = producto.disponible;
    showModal('Editar Producto');
};

// INICIO
(async () => {
    await renderCategoriasDropdown();
    await cargarProductosDesdeBackend();
})();

// Eventos UI
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
        imagenURL: imagen
    };

    try {
        if (!idString) {
            // Crear
            await crearProducto(dtoPayload);
        } else {
            // Actualizar
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
export {};
