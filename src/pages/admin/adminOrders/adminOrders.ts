// src/pages/admin/orders/orders-admin.ts
import type { IPedido } from "../../../types/IPedido";
import type { IDetallePedido } from "../../../types/IPedido";
import { checkAuthUser } from "../../../utils/auth";
import { logoutUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";
import { getPedido, getProductos, actualizarEstadoPedidoApi, getUsuario } from "../../../utils/api";


import { getPedidos } from "../../../utils/api";

// --- PROTECCIÓN / DOM ---
checkAuthUser("ADMIN", "/src/pages/auth/login/login.html");

const buttonLogout = document.getElementById("button_logout") as HTMLButtonElement;
const tablaPedidosBody = document.getElementById("tabla-pedidos-body") as HTMLTableSectionElement;
const filterEstado = document.getElementById("filter-estado") as HTMLSelectElement;
const btnRefrescar = document.getElementById("btn-refrescar") as HTMLButtonElement;

// Modal
const modal = document.getElementById("modal-pedido") as HTMLDivElement;
const modalClose = document.getElementById("modal-close") as HTMLSpanElement;
const btnCerrarModal = document.getElementById("btn-cerrar-modal") as HTMLButtonElement;
const btnActualizarEstado = document.getElementById("btn-actualizar-estado") as HTMLButtonElement;
const selectEstadoActualizar = document.getElementById("select-estado-actualizar") as HTMLSelectElement;

// Modal fields
const modalPedidoId = document.getElementById("modal-pedido-id") as HTMLSpanElement;
const modalUsuarioId = document.getElementById("modal-usuario-id") as HTMLSpanElement;
const modalDireccion = document.getElementById("modal-direccion") as HTMLSpanElement;
const modalTelefono = document.getElementById("modal-telefono") as HTMLSpanElement;
const modalMetodoPago = document.getElementById("modal-metodo-pago") as HTMLSpanElement;
const modalNotas = document.getElementById("modal-notas") as HTMLSpanElement;
const modalNotasContainer = document.getElementById("modal-notas-container") as HTMLParagraphElement;
const modalProductosList = document.getElementById("modal-productos-list") as HTMLDivElement;
const modalSubtotal = document.getElementById("modal-subtotal") as HTMLSpanElement;
const modalEnvio = document.getElementById("modal-envio") as HTMLSpanElement;
const modalTotal = document.getElementById("modal-total") as HTMLSpanElement;
const modalFecha = document.getElementById("modal-fecha") as HTMLSpanElement;
const modalEstadoBadge = document.getElementById("modal-estado-badge") as HTMLSpanElement;
const modalEstadoIcon = document.getElementById("modal-estado-icon") as HTMLDivElement;
const modalEstadoMensaje = document.getElementById("modal-estado-mensaje") as HTMLParagraphElement;

// Constantes
const COSTO_ENVIO = 500;

// Estados (misma configuración visual que usás en user orders)
const estadosConfig: Record<string, { texto: string; icon: string; clase: string; mensaje: string }> = {
  pending: { texto: 'Pendiente', icon: '⏳', clase: 'badge-warning', mensaje: 'Pedido pendiente' },
  processing: { texto: 'En Preparación', icon: '👨‍🍳', clase: 'badge-info', mensaje: 'En preparación' },
  completed: { texto: 'Entregado', icon: '✅', clase: 'badge-success', mensaje: 'Pedido entregado' },
  cancelled: { texto: 'Cancelado', icon: '❌', clase: 'badge-danger', mensaje: 'Pedido cancelado' }
};

// productMap: carga todos los productos una sola vez para mostrar nombre/imagen por productoId
const productMap = new Map<number, any>();
const cargarProductosMap = async () => {
  try {
    const productos = await getProductos();
    (productos ?? []).forEach((p: any) => productMap.set(p.id, p));
  } catch (err) {
    console.warn("No se pudieron cargar productos:", err);
  }
};

// Utility: formatea fecha ISO
const formatearFecha = (fecha: string) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  return d.toLocaleString('es-AR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Estado en memoria
let pedidosCache: IPedido[] = [];
let pedidoActual: IPedido | null = null;

// Cargar lista completa de pedidos
const cargarPedidosAdmin = async () => {
  try {
    const pedidos: IPedido[] = await getPedidos();
    pedidosCache = (pedidos ?? []).map(p => ({ ...p, estado: p.estado ?? 'pending' }));
    renderTabla(pedidosCache);
  } catch (err) {
    console.error("Error al cargar pedidos admin:", err);
    tablaPedidosBody.innerHTML = `<tr><td colspan="8">Error al cargar pedidos</td></tr>`;
  }
};

// Render de la tabla con posibilidad de filtro
const renderTabla = (lista: IPedido[]) => {
  const estadoFiltro = filterEstado.value;
  const filas = (lista ?? []).filter(p => estadoFiltro === 'all' ? true : p.estado === estadoFiltro);

  tablaPedidosBody.innerHTML = '';
  filas.forEach(async pedido => {
    const userOrderName = await getUsuario(pedido.usuarioId!);
    const tr = document.createElement('tr');
    const usuarioText = userOrderName.nombre;
    const fechaText = formatearFecha(pedido.fecha);
    const totalText = `$${(pedido.total ?? 0).toFixed(2)}`;
    const estado = pedido.estado ?? 'pending';

    tr.innerHTML = `
      <td>${pedido.id}</td>
      <td>${usuarioText}</td>
      <td>${fechaText}</td>
      <td><span class="badge ${estadosConfig[estado].clase}">${estadosConfig[estado].icon} ${estadosConfig[estado].texto}</span></td>
      <td>${totalText}</td>
      <td>${pedido.telefono ?? ''}</td>
      <td>${pedido.direccion ?? ''}</td>
      <td>
        <button class="btn btn-sm btn-primary btn-ver" data-id="${pedido.id}">Ver</button>
      </td>
    `;
    tablaPedidosBody.appendChild(tr);
  });

  // listeners para ver detalle
  document.querySelectorAll('.btn-ver').forEach(b => {
    b.addEventListener('click', async (e) => {
      const id = Number((e.currentTarget as HTMLElement).dataset.id);
      await abrirModalPedido(id);
    });
  });
};

// Abrir modal con detalle del pedido
const abrirModalPedido = async (id: number) => {
  try {
    const pedido = await getPedido(id);
    pedidoActual = pedido;
    // Asegurar estado
    pedido.estado = pedido.estado ?? 'pending';

    // Llenar campos del modal
    modalPedidoId.textContent = String(pedido.id);
    modalUsuarioId.textContent = String(pedido.usuarioId ?? '');
    modalDireccion.textContent = pedido.direccion ?? '';
    modalTelefono.textContent = pedido.telefono ?? '';
    modalMetodoPago.textContent = pedido.metodoPago ?? '';
    if (pedido.notas) {
      modalNotas.textContent = pedido.notas;
      modalNotasContainer.style.display = 'block';
    } else {
      modalNotasContainer.style.display = 'none';
    }

    // Estado visual
    const cfg = estadosConfig[pedido.estado];
    modalEstadoBadge.textContent = cfg.texto;
    modalEstadoBadge.className = `badge ${cfg.clase}`;
    modalEstadoIcon.textContent = cfg.icon;
    modalEstadoMensaje.textContent = cfg.mensaje;

  

    // Productos (usar productMap para nombre/imagen)
    modalProductosList.innerHTML = '';
    const detalles: IDetallePedido[] = (pedido.detalles ?? []).slice();
    detalles.forEach(d => {
      const prod = productMap.get(d.productoId);
      const nombre = prod ? prod.nombre : `Producto #${d.productoId}`;
      const imagen = prod ? (prod.imagenURL ?? prod.imagen ?? '/placeholder.jpg') : '/placeholder.jpg';
      const precio = (d.precioUnitario ?? 0).toFixed(2);
      const itemDiv = document.createElement('div');
      itemDiv.className = 'producto-item';
      itemDiv.innerHTML = `
        <img src="${imagen}" alt="${nombre}">
        <div class="producto-info">
          <h4>${nombre}</h4>
          <p>Cantidad: ${d.cantidad}</p>
          <p>Precio unitario: $${precio}</p>
        </div>
        <div class="producto-total"><strong>$${( (d.precioUnitario ?? 0) * (d.cantidad ?? 0) ).toFixed(2)}</strong></div>
      `;
      modalProductosList.appendChild(itemDiv);
    });

    // Subtotal / envio / total
    const subtotal = detalles.reduce((acc, it) => acc + ((it.precioUnitario ?? 0) * (it.cantidad ?? 0)), 0);
    modalSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    modalEnvio.textContent = `$${COSTO_ENVIO.toFixed(2)}`;
    modalTotal.textContent = `$${(pedido.total ?? subtotal + COSTO_ENVIO).toFixed(2)}`;

    // Mostrar fecha
    modalFecha.textContent = formatearFecha(pedido.fecha);

    // Select de estado actual (sync)
    (selectEstadoActualizar.value as any) = pedido.estado;

    // Mostrar modal
    modal.style.display = 'flex';
  } catch (err) {
    console.error("Error abriendo modal pedido:", err);
    alert("No se pudo cargar el detalle del pedido.");
  }
};

// Actualizar estado del pedido (PUT)
const actualizarEstadoPedido = async () => {
  if (!pedidoActual) return alert("No hay pedido seleccionado.");
  const nuevoEstado = selectEstadoActualizar.value;

  try {
    await actualizarEstadoPedidoApi(pedidoActual.id!, nuevoEstado);
    // refrescar lista y modal
    await cargarPedidosAdmin();
    modal.style.display = 'none';
    alert("Estado actualizado correctamente.");
  } catch (err) {
    console.error("Error actualizando estado:", err);
    alert("No se pudo actualizar el estado.");
  }
};

// Listeners de botones
buttonLogout.addEventListener('click', () => {
  logoutUser();
  navigate("/src/pages/auth/login/login.html");
});

modalClose.addEventListener('click', () => modal.style.display = 'none');
btnCerrarModal.addEventListener('click', () => modal.style.display = 'none');
btnActualizarEstado.addEventListener('click', actualizarEstadoPedido);
btnRefrescar.addEventListener('click', cargarPedidosAdmin);
filterEstado.addEventListener('change', () => renderTabla(pedidosCache));

// Inicialización
const initPage = async () => {
  await cargarProductosMap(); 
  await cargarPedidosAdmin();
};

initPage();

export {};