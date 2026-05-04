import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class FilterAuditoriasDto {
    @ApiPropertyOptional({
        example: 1,
        description: 'Filtrar por ID del usuario que realizó la acción',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    usuarioId?: number;

    @ApiPropertyOptional({
        example: 'CREAR',
        description: 'Filtrar por acción realizada',
    })
    @IsString()
    @IsOptional()
    accion?: string;

    @ApiPropertyOptional({
        example: 'Factura',
        description: 'Filtrar por entidad afectada',
    })
    @IsString()
    @IsOptional()
    entidad?: string;

    @ApiPropertyOptional({
        example: 10,
        description: 'Filtrar por ID de la entidad afectada',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    entidadId?: number;

    @ApiPropertyOptional({
        example: '2026-05-01',
        description: 'Fecha inicial',
    })
    @IsDateString()
    @IsOptional()
    fechaDesde?: string;

    @ApiPropertyOptional({
        example: '2026-05-31',
        description: 'Fecha final',
    })
    @IsDateString()
    @IsOptional()
    fechaHasta?: string;

    @ApiPropertyOptional({
        example: 'pago',
        description: 'Búsqueda por texto en acción, entidad o descripción',
    })
    @IsString()
    @IsOptional()
    buscar?: string;
}