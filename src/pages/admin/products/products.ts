// src/pages/admin/products/products.ts
import type { IProducto } from "../../../types/IProducto";
import type { ICategoria } from "../../../types/ICategoria";
import { getProductos, crearProducto, actualizarProducto, borrarProducto, getCategorias } from "../../../utils/api";
import { checkAuthUser } from "../../../utils/auth";
import { logoutUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";

let productos: IProducto[] = [];

checkAuthUser("ADMIN", "/src/pages/auth/login/login.html");

// ---------------------------
// DOM elements
// ---------------------------
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

// ---------------------------
// Modales dinámicos (reutilizables)
// ---------------------------
const createModalElement = (innerHtml: string) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'dynamic-modal-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.left = '0';
    backdrop.style.top = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.display = 'flex';
    backdrop.style.alignItems = 'center';
    backdrop.style.justifyContent = 'center';
    backdrop.style.zIndex = '9999';
    backdrop.style.background = 'rgba(0,0,0,0.4)';

    const container = document.createElement('div');
    container.className = 'dynamic-modal';
    container.style.background = '#fff';
    container.style.padding = '18px';
    container.style.borderRadius = '8px';
    container.style.width = 'min(560px, 94%)';
    container.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
    container.innerHTML = innerHtml;

    backdrop.appendChild(container);
    document.body.appendChild(backdrop);
    return { backdrop, container };
};

/**
 * showInfoModal: modal simple con botón Aceptar (resuelve Promise cuando se cierra)
 */
const showInfoModal = (title: string, text: string) => {
    return new Promise<void>((resolve) => {
        const inner = `
          <div style="display:flex;flex-direction:column;gap:12px">
            <h3 style="margin:0">${title}</h3>
            <div style="white-space:pre-wrap">${text}</div>
            <div style="display:flex;justify-content:flex-end;margin-top:8px">
              <button id="dynamic-ok" class="btn btn-primary">Aceptar</button>
            </div>
          </div>
        `;
        const { backdrop } = createModalElement(inner);
        const ok = backdrop.querySelector('#dynamic-ok') as HTMLButtonElement;
        const cleanup = () => {
            backdrop.remove();
            resolve();
        };
        ok.addEventListener('click', cleanup);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) cleanup();
        });
    });
};

/**
 * showConfirmModal: modal con Aceptar/Cancelar -> resuelve true/false
 */
const showConfirmModal = (title: string, text: string) => {
    return new Promise<boolean>((resolve) => {
        const inner = `
          <div style="display:flex;flex-direction:column;gap:12px">
            <h3 style="margin:0">${title}</h3>
            <div style="white-space:pre-wrap">${text}</div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
              <button id="dynamic-cancel" class="btn">Cancelar</button>
              <button id="dynamic-yes" class="btn btn-primary">Aceptar</button>
            </div>
          </div>
        `;
        const { backdrop } = createModalElement(inner);
        const yes = backdrop.querySelector('#dynamic-yes') as HTMLButtonElement;
        const cancel = backdrop.querySelector('#dynamic-cancel') as HTMLButtonElement;
        const cleanup = (result: boolean) => {
            backdrop.remove();
            resolve(result);
        };
        yes.addEventListener('click', () => cleanup(true));
        cancel.addEventListener('click', () => cleanup(false));
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) cleanup(false);
        });
    });
};

// ---------------------------
// Helper: DTO -> IProducto
// ---------------------------
const dtoToIProducto = (dto: any): IProducto => {
    return {
        id: dto.id,
        nombre: dto.nombre,
        descripcion: dto.descripcion || '',
        precio: dto.precio ?? 0,
        stock: dto.stock,
        categoriaId: dto.categoriaId ?? null,
        imagenURL: dto.imagenURL ?? '',
        disponible: dto.disponible ?? false
    } as IProducto;
};

// ---------------------------
// Cargar y renderizar categorías en <select>
// ---------------------------
const renderCategoriasDropdown = async () => {
    categoriaSelect.innerHTML = '';
    try {
        const categoriasFromBackend = await getCategorias().catch(() => null);
        const lista = categoriasFromBackend ?? [];
        lista.forEach((categoria: ICategoria) => {
            const option = document.createElement('option');
            option.value = categoria.id.toString();
            option.textContent = categoria.nombre;
            categoriaSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error al cargar categorías:', err);
        await showInfoModal('Error', 'No se pudieron cargar las categorías desde el servidor.');
    }
};

// ---------------------------
// Render tabla productos
// ---------------------------
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

    // Listeners para ELIMINAR (ahora con modal confirm)
    document.querySelectorAll('.btn-eliminar').forEach(boton => {
        boton.addEventListener('click', async () => {
            const id = (boton as HTMLElement).dataset.id;
            if (!id) return;
            const confirmar = await showConfirmModal('Confirmar eliminación', `¿Estás seguro que querés eliminar el producto con ID ${id}?`);
            if (!confirmar) return;

            try {
                await borrarProducto(parseInt(id));
                await cargarProductosDesdeBackend();
                await showInfoModal('Eliminado', `Producto ${id} eliminado correctamente.`);
            } catch (err) {
                console.error('Error al eliminar producto:', err);
                await showInfoModal('Error', 'No se pudo eliminar el producto. Revisá la consola para más detalles.');
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

// ---------------------------
// Obtener nombre de categoría por ID
// ---------------------------
const getCategoriaNombre = (id: number | null) => {
    if (!id) return 'Desconocida';
    const option = categoriaSelect.querySelector(`option[value="${id}"]`) as HTMLOptionElement;
    return option ? option.textContent || 'Desconocida' : 'Desconocida';
};

// ---------------------------
// Mostrar / ocultar modal de formulario (tu modal existente)
// ---------------------------
const showModal = (title: string) => {
    modalTitulo.textContent = title;
    // uso de display:flex para mantener compatibilidad con tu CSS anterior
    modalProducto.style.display = "flex";
};
const hideModal = () => {
    modalProducto.style.display = "none";
    formProducto.reset();
    productoIdInput.value = '';
};

// ---------------------------
// Traer productos desde backend
// ---------------------------
const cargarProductosDesdeBackend = async () => {
    try {
        const dtos = await getProductos();
        productos = (dtos ?? []).map((d: any) => dtoToIProducto(d));
        renderProductos();
    } catch (err) {
        console.error('Error al cargar productos desde backend:', err);
        await showInfoModal('Error', 'No se pudo obtener la lista de productos del servidor. Reintentá más tarde.');
        // En caso de error mostramos tabla vacía
        productos = [];
        renderProductos();
    }
};

// ---------------------------
// Handler editar (carga producto al form)
// ---------------------------
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
    disponibleInput.checked = producto.disponible ?? false;
    showModal('Editar Producto');
};

// ---------------------------
// INIT: cargar categorías y productos
// ---------------------------
(async () => {
    await renderCategoriasDropdown();
    await cargarProductosDesdeBackend();
})();

// ---------------------------
// UI Event Listeners
// ---------------------------
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

    // Validación: reemplazamos alert por modal informativo
    if (!nombre || !descripcion || isNaN(precio) || !categoriaId || !imagen) {
        await showInfoModal("Formulario incompleto", "Por favor, completá todos los campos obligatorios.");
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
            await showInfoModal('Creado', 'Producto creado correctamente.');
        } else {
            const id = parseInt(idString);
            await actualizarProducto(id, dtoPayload);
            await showInfoModal('Actualizado', 'Producto actualizado correctamente.');
        }
        await cargarProductosDesdeBackend();
        hideModal();
    } catch (err) {
        console.error('Error al guardar producto:', err);
        await showInfoModal('Error', 'Ocurrió un error guardando el producto. Revisá la consola para más detalles.');
    }
});

// Logout
buttonLogout.addEventListener("click", () => {
    logoutUser();
    navigate("/src/pages/auth/login/login.html");
});

export {};
