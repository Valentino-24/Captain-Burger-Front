import type { IPedido } from "../../../types/IPedido";
import { checkAuthUser, getCurrentUser } from "../../../utils/auth";
import { logoutUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";
import { getPedidosUsuario, getPedido } from "../../../utils/api";

// Elementos del DOM
const buttonLogout = document.getElementById("button_logout") as HTMLButtonElement;
const loading = document.getElementById("loading") as HTMLDivElement;
const emptyOrders = document.getElementById("empty-orders") as HTMLDivElement;
const ordersList = document.getElementById("orders-list") as HTMLDivElement;

const userName = document.getElementById("user-name") as HTMLSpanElement;
const user = localStorage.getItem("userData");
userName.textContent = user ? JSON.parse(user).nombre : "USUARIO";

// Modal
const modal = document.getElementById("modal-detalle") as HTMLDivElement;
const modalClose = document.querySelector(".modal-close") as HTMLSpanElement;
const btnCerrarModal = document.getElementById("btn-cerrar-modal") as HTMLButtonElement;

// Constantes
const COSTO_ENVIO = 500;

// Configuración de estados
const estadosConfig = {
    pending: {
        texto: 'Pendiente',
        icon: '⏳',
        clase: 'badge-warning',
        mensaje: 'Tu pedido está siendo procesado'
    },
    processing: {
        texto: 'En Preparación',
        icon: '👨‍🍳',
        clase: 'badge-info',
        mensaje: 'Tu pedido está siendo preparado'
    },
    completed: {
        texto: 'Entregado',
        icon: '✅',
        clase: 'badge-success',
        mensaje: '¡Tu pedido fue entregado!'
    },
    cancelled: {
        texto: 'Cancelado',
        icon: '❌',
        clase: 'badge-danger',
        mensaje: 'Este pedido fue cancelado'
    }
};

// Formatear fecha

const formatearFecha = (fecha: string): string => {
    const date = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('es-AR', opciones);
};

// Cargar pedidos del usuario autenticado

const cargarPedidos = async () => {
    const usuario = getCurrentUser();
    if (!usuario) {
        alert("Error: Usuario no autenticado");
        navigate("/src/pages/auth/login/login.html");
        return;
    }

    loading.style.display = "block";
    emptyOrders.style.display = "none";
    ordersList.style.display = "none";

    try {
        const pedidos: IPedido[] = await getPedidosUsuario(usuario.id!);
        loading.style.display = "none";

        if (!pedidos || pedidos.length === 0) {
            emptyOrders.style.display = "block";
            return;
        }
        pedidos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        renderizarPedidos(pedidos);
        ordersList.style.display = "block";

    } catch (error) {
        console.error("Error al cargar pedidos:", error);
        loading.style.display = "none";
        alert("Error al cargar los pedidos");
    }
};

// Renderizar lista de pedidos

const renderizarPedidos = (pedidos: IPedido[]) => {
    ordersList.innerHTML = '';
    pedidos.forEach(pedido => {
        pedido.estado = pedido.estado || 'pending';
        const estadoConfig = estadosConfig[pedido.estado];

        const cantidadTotal = pedido.detalles.reduce((acc, item) => acc + item.cantidad, 0);

        const productosResumen = pedido.detalles.slice(0, 3);
        const productosExtra = pedido.detalles.length - 3;
        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
        <div class="order-header">
            <div>
                <h3>Pedido #${pedido.id}</h3>
                <p class="order-date">${formatearFecha(pedido.fecha)}</p>
            </div>
            <span class="badge ${estadoConfig.clase}">${estadoConfig.icon} ${estadoConfig.texto}</span>
        </div>

        <div class="order-body">
            <div class="order-productos-preview">
                ${productosResumen.map(item => `
                <span class="producto-preview">Producto: ${item.productoNombre} (x${item.cantidad})</span>
                `).join('')}
                ${productosExtra > 0 ? `<span class="producto-preview-extra">+${productosExtra} más</span>` : ''}
            </div>
        
            <div class="order-info">
                <p><strong>${cantidadTotal}</strong> productos</p>
                <p class="order-total">Total: <strong>$${pedido.total.toFixed(2)}</strong></p>
            </div>
        </div>

        <div class="order-footer">
            <button class="btn btn-primary btn-sm btn-ver-detalle" data-id="${pedido.id}">
                Ver Detalle
            </button>
        </div>
        `;

        ordersList.appendChild(card);
    });

    // Event listeners para botones "Ver Detalle"
    document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt((e.currentTarget as HTMLElement).dataset.id!);
            await mostrarDetallePedido(id);
        });
    });
};

// Mostrar detalle del pedido en el modal

const mostrarDetallePedido = async (pedidoId: number) => {
    try {
        const pedido: IPedido = await getPedido(pedidoId);
        pedido.estado = pedido.estado || 'pending'; // Asegurar que estado tenga un valor válido
        const estadoConfig = estadosConfig[pedido.estado];

        // Llenar información del modal
        (document.getElementById('modal-pedido-numero') as HTMLSpanElement).textContent = pedido.id.toString();
        (document.getElementById('modal-estado-icon') as HTMLDivElement).textContent = estadoConfig.icon;
    
        const estadoBadge = document.getElementById('modal-estado-badge') as HTMLSpanElement;
        estadoBadge.textContent = estadoConfig.texto;
        estadoBadge.className = `badge ${estadoConfig.clase}`;
    
        (document.getElementById('modal-estado-mensaje') as HTMLParagraphElement).textContent = estadoConfig.mensaje;
        (document.getElementById('modal-direccion') as HTMLSpanElement).textContent = pedido.direccion;
        (document.getElementById('modal-telefono') as HTMLSpanElement).textContent = pedido.telefono;
        (document.getElementById('modal-metodo-pago') as HTMLSpanElement).textContent = pedido.metodoPago;
    
        // Notas (opcional)
        const notasContainer = document.getElementById('modal-notas-container') as HTMLParagraphElement;
        if (pedido.notas) {
            (document.getElementById('modal-notas') as HTMLSpanElement).textContent = pedido.notas;
            notasContainer.style.display = 'block';
        } else {
            notasContainer.style.display = 'none';
        }

        // Productos
        const productosListModal = document.getElementById('modal-productos-list') as HTMLDivElement;
        productosListModal.innerHTML = '';
    
        pedido.detalles.forEach(detalle => {
            const productoDiv = document.createElement('div');
            productoDiv.className = 'producto-item';
            productoDiv.innerHTML = `
            <img src="${detalle.productoImagen || '/placeholder.jpg'}" alt="${detalle.productoNombre}">
            <div class="producto-info">
                <h4>${detalle.productoNombre}</h4>
                <p>Cantidad: ${detalle.cantidad}</p>
                <p>Precio unitario: $${detalle.precioUnitario.toFixed(2)}</p>
            </div>
            <div class="producto-total">
                <strong>$${(detalle.precioUnitario * detalle.cantidad).toFixed(2)}</strong>
            </div>
            `;
            productosListModal.appendChild(productoDiv);
        });

        // Calcular subtotal
        const subtotal = pedido.detalles.reduce(
            (acc, item) => acc + (item.precioUnitario * item.cantidad),
            0
        );

        (document.getElementById('modal-subtotal') as HTMLSpanElement).textContent = `$${subtotal.toFixed(2)}`;
        (document.getElementById('modal-envio') as HTMLSpanElement).textContent = `$${COSTO_ENVIO.toFixed(2)}`;
        (document.getElementById('modal-total') as HTMLSpanElement).textContent = `$${pedido.total.toFixed(2)}`;
        (document.getElementById('modal-fecha') as HTMLSpanElement).textContent = formatearFecha(pedido.fecha);

        // Mostrar modal
        modal.style.display = 'flex';

    } catch (error) {
        console.error("Error al cargar detalle del pedido:", error);
        alert("Error al cargar el detalle del pedido");
    }
};

// Eventos del modal

modalClose.addEventListener('click', () => {
    modal.style.display = 'none';
});

btnCerrarModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Logout

buttonLogout.addEventListener("click", () => {
    logoutUser();
    navigate("/src/pages/auth/login/login.html");
});

// Inicialización

const initPage = () => {
    checkAuthUser("USUARIO", "/src/pages/auth/login/login.html");
    cargarPedidos();
};

initPage();

export { };