// src/pages/admin/categories/categories.ts
import type { ICategoria } from "../../../types/ICategoria";
import { getCategorias, crearCategoria, actualizarCategoria, borrarCategoria } from "../../../utils/api";
import { logoutUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";

// Elementos DOM
const btnNuevaCategoria = document.getElementById("btn-nueva-categoria") as HTMLButtonElement;
const btnCancelar = document.getElementById("btn-cancelar") as HTMLButtonElement;
const btnCerrarModal = document.getElementById("btn-cerrar-modal") as HTMLSpanElement;
const tablaCategoriasBody = document.getElementById("tabla-categorias-body") as HTMLTableSectionElement;
const modalCategoria = document.getElementById("modal-categoria") as HTMLDivElement;
const formCategoria = document.getElementById("form-categoria") as HTMLFormElement;
const modalTitulo = document.getElementById("modal-titulo") as HTMLHeadingElement;
const categoriaIdInput = document.getElementById("categoria-id") as HTMLInputElement;
const nombreInput = document.getElementById("nombre") as HTMLInputElement;
const descripcionInput = document.getElementById("descripcion") as HTMLInputElement;
const buttonLogout = document.getElementById("button_logout") as HTMLButtonElement;

const userName = document.getElementById("user-name") as HTMLSpanElement;
const user = localStorage.getItem("userData");
userName.textContent = user ? JSON.parse(user).nombre : "Admin";

let categorias: ICategoria[] = [];

/* ---------------------------
   Modales dinámicos reutilizables
   --------------------------- */
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
  backdrop.style.background = 'rgba(0,0,0,0.35)';

  const container = document.createElement('div');
  container.className = 'dynamic-modal';
  container.style.background = '#fff';
  container.style.padding = '16px';
  container.style.borderRadius = '8px';
  container.style.width = 'min(560px, 96%)';
  container.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
  container.innerHTML = innerHtml;

  backdrop.appendChild(container);
  document.body.appendChild(backdrop);
  return { backdrop, container };
};

const showInfoModal = (title: string, text: string) => {
  return new Promise<void>((resolve) => {
    const inner = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <h3 style="margin:0">${title}</h3>
        <div style="white-space:pre-wrap">${text}</div>
        <div style="display:flex;justify-content:flex-end;margin-top:12px">
          <button id="dynamic-ok" class="btn btn-primary">Aceptar</button>
        </div>
      </div>
    `;
    const { backdrop } = createModalElement(inner);
    const ok = backdrop.querySelector('#dynamic-ok') as HTMLButtonElement;
    const cleanup = () => { backdrop.remove(); resolve(); };
    ok.addEventListener('click', cleanup);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) cleanup(); });
  });
};

const showConfirmModal = (title: string, text: string) => {
  return new Promise<boolean>((resolve) => {
    const inner = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <h3 style="margin:0">${title}</h3>
        <div style="white-space:pre-wrap">${text}</div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
          <button id="dynamic-cancel" class="btn">Cancelar</button>
          <button id="dynamic-yes" class="btn btn-primary">Aceptar</button>
        </div>
      </div>
    `;
    const { backdrop } = createModalElement(inner);
    const yes = backdrop.querySelector('#dynamic-yes') as HTMLButtonElement;
    const cancel = backdrop.querySelector('#dynamic-cancel') as HTMLButtonElement;
    const cleanup = (result: boolean) => { backdrop.remove(); resolve(result); };
    yes.addEventListener('click', () => cleanup(true));
    cancel.addEventListener('click', () => cleanup(false));
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) cleanup(false); });
  });
};

/* ---------------------------
   Modal de creación/edición (UI)
   --------------------------- */
const showModal = (title: string) => {
  modalTitulo.textContent = title;
  modalCategoria.style.display = "flex";
};

const hideModal = () => {
  modalCategoria.style.display = "none";
  formCategoria.reset();
  categoriaIdInput.value = '';
};

/* ---------------------------
   Render de categorías
   --------------------------- */
const renderCategorias = () => {
  tablaCategoriasBody.innerHTML = '';

  categorias.forEach(categoria => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${categoria.id}</td>
      <td>${categoria.nombre}</td>
      <td>${categoria.descripcion ?? ''}</td>
      <td>
        <button class="btn-editar" data-id="${categoria.id}">Editar</button>
        <button class="btn-eliminar" data-id="${categoria.id}">Eliminar</button>
      </td>
    `;

    tablaCategoriasBody.appendChild(tr);
  });

  // Para evitar listeners duplicados clonamos nodos y luego asignamos handlers limpios
  const eliminarBtns = Array.from(document.querySelectorAll('.btn-eliminar')) as HTMLElement[];
  eliminarBtns.forEach(b => {
    const clone = b.cloneNode(true) as HTMLElement;
    b.parentElement?.replaceChild(clone, b);
  });

  const editarBtns = Array.from(document.querySelectorAll('.btn-editar')) as HTMLElement[];
  editarBtns.forEach(b => {
    const clone = b.cloneNode(true) as HTMLElement;
    b.parentElement?.replaceChild(clone, b);
  });

  // Asignar listeners
  document.querySelectorAll('.btn-eliminar').forEach(boton => {
    boton.addEventListener('click', async () => {
      const id = (boton as HTMLElement).dataset.id;
      if (!id) return;
      const confirmar = await showConfirmModal('Confirmar eliminación', `¿Estás seguro que querés eliminar la categoría con ID ${id}?`);
      if (!confirmar) return;

      try {
        await borrarCategoria(parseInt(id));
        await cargarCategoriasDesdeBackend();
        await showInfoModal('Categoría eliminada', `La categoría ${id} fue eliminada correctamente.`);
      } catch (err) {
        console.error('Error al eliminar categoría:', err);
        await showInfoModal('Error', 'No se pudo eliminar la categoría. Revisa la consola para más detalles.');
      }
    });
  });

  document.querySelectorAll('.btn-editar').forEach(boton => {
    boton.addEventListener('click', () => {
      const id = (boton as HTMLElement).dataset.id;
      if (!id) return;
      handleEdit(parseInt(id));
    });
  });
};

/* ---------------------------
   CRUD Backend
   --------------------------- */
const cargarCategoriasDesdeBackend = async () => {
  try {
    const dtos = await getCategorias();
    categorias = (dtos ?? []).map((d: any) => ({
      id: d.id,
      nombre: d.nombre,
      descripcion: d.descripcion ?? ''
    } as ICategoria));
    renderCategorias();
  } catch (err) {
    console.error('Error al cargar categorías desde backend:', err);
    categorias = [];
    renderCategorias();
    await showInfoModal('Error', 'No se pudieron cargar las categorías. Reintentá más tarde.');
  }
};

const handleEdit = (id: number) => {
  const categoria = categorias.find(c => c.id === id);
  if (!categoria) return;
  categoriaIdInput.value = String(categoria.id);
  nombreInput.value = categoria.nombre;
  descripcionInput.value = categoria.descripcion ?? '';
  showModal('Editar Categoría');
};

/* ---------------------------
   Event handlers UI
   --------------------------- */
btnNuevaCategoria.addEventListener('click', () => {
  formCategoria.reset();
  categoriaIdInput.value = '';
  showModal('Nueva Categoría');
});

btnCancelar.addEventListener('click', hideModal);
btnCerrarModal.addEventListener('click', hideModal);

// Envío del formulario: crear o editar
formCategoria.addEventListener('submit', async (event) => {
  event.preventDefault();

  const idString = categoriaIdInput.value;
  const nombre = nombreInput.value.trim();
  const descripcion = descripcionInput.value.trim();

  if (!nombre) {
    await showInfoModal('Atención', 'El nombre es obligatorio.');
    return;
  }

  const payload = { nombre, descripcion };

  try {
    if (!idString) {
      // Crear
      await crearCategoria(payload);
      await showInfoModal('Categoría creada', `La categoría "${nombre}" fue creada correctamente.`);
    } else {
      // Editar
      const id = parseInt(idString);
      await actualizarCategoria(id, payload);
      await showInfoModal('Categoría actualizada', `La categoría "${nombre}" fue actualizada.`);
    }
    await cargarCategoriasDesdeBackend();
    hideModal();
  } catch (err) {
    console.error('Error guardando categoría:', err);
    await showInfoModal('Error', 'Ocurrió un error al guardar la categoría. Revisa la consola.');
  }
});

buttonLogout.addEventListener("click", () => {
  logoutUser();
  navigate("/src/pages/auth/login/login.html");
});

/* ---------------------------
   Inicialización
   --------------------------- */
(async () => {
  await cargarCategoriasDesdeBackend();
})();

export {};
