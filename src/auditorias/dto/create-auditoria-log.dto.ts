export interface CreateAuditoriaLogDto {
    usuarioId?: number | null;
    accion: string;
    entidad: string;
    entidadId?: number | null;
    descripcion?: string | null;
    ip?: string | null;
}