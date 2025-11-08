export interface IProducto {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    categoriaId: number;
    imagenURL: string;
    disponible: boolean;
}