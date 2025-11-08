import type { ICategoria } from "../../../types/ICategoria";
import { getCategorias, crearCategoria, actualizarCategoria, borrarCategoria } from "../../../utils/api";
import { logoutUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";


//checkAuthUser("ADMIN", "/src/pages/auth/login/login.html");

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


const showModal = (title: string) => {
  modalTitulo.textContent = title;
  modalCategoria.style.display = "flex";
};

const hideModal = () => {
  modalCategoria.style.display = "none";
  formCategoria.reset();
  categoriaIdInput.value = '';
};

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

  // eliminar
  document.querySelectorAll('.btn-eliminar').forEach(boton => {
    boton.addEventListener('click', async () => {
      const id = (boton as HTMLElement).dataset.id;
      if (!id) return;
      if (!confirm(`¿Estás seguro que querés eliminar la categoría con ID ${id}?`)) return;

      try {
        await borrarCategoria(parseInt(id));
        await cargarCategoriasDesdeBackend();
      } catch (err) {
        console.error('Error al eliminar categoría:', err);
        alert('No se pudo eliminar la categoría. Revisa la consola.');
      }
    });
  });

  // editar
  document.querySelectorAll('.btn-editar').forEach(boton => {
    boton.addEventListener('click', () => {
      const id = (boton as HTMLElement).dataset.id;
      if (!id) return;
      handleEdit(parseInt(id));
    });
  });
};

/* ---------- CRUD Backend ---------- */

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
    alert('No se pudieron cargar las categorías. Reintentá más tarde.');
    categorias = [];
    renderCategorias();
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
    alert('El nombre es obligatorio.');
    return;
  }

  const payload = { nombre, descripcion };

  try {
    if (!idString) {
      // Crear
      await crearCategoria(payload);
    } else {
      // Editar
      const id = parseInt(idString);
      await actualizarCategoria(id, payload);
    }
    await cargarCategoriasDesdeBackend();
    hideModal();
  } catch (err) {
    console.error('Error guardando categoría:', err);
    alert('Ocurrió un error al guardar la categoría.');
  }
});

buttonLogout.addEventListener("click", () => {
    logoutUser();
    navigate("/src/pages/auth/login/login.html");
});

// Inicialización

(async () => {
  await cargarCategoriasDesdeBackend();
})();

export {};