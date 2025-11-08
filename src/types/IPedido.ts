export interface IPedido {
    id: number;
    usuarioId: number;
    fecha: string;
    estado: 'pending' | 'processing' | 'completed' | 'cancelled';
    total: number;
    telefono: string;
    direccion: string;
    metodoPago: string;
    notas?: string;
    detalles: IDetallePedido[];
}

export interface IDetallePedido {
    id: number;
    productoId: number;
    productoNombre: string;
    productoImagen?: string;
    cantidad: number;
    precioUnitario: number;
}

// Tipos auxiliares para estados
export type EstadoPedido = 'pending' | 'processing' | 'completed' | 'cancelled';