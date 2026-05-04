import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
} from 'class-validator';
import { EstadoReconexion } from '../../generated/prisma/enums';

export class FilterReconexionesDto {
    @ApiPropertyOptional({
        example: 2,
        description: 'Filtrar por usuarioId del ciudadano',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    ciudadanoId?: number;

    @ApiPropertyOptional({
        example: 1,
        description: 'Filtrar por ID de corte',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    corteId?: number;

    @ApiPropertyOptional({
        example: 3,
        description: 'Filtrar por técnico asignado',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    tecnicoId?: number;

    @ApiPropertyOptional({
        example: EstadoReconexion.PENDIENTE,
        enum: EstadoReconexion,
        description: 'Filtrar por estado de reconexión',
    })
    @IsEnum(EstadoReconexion)
    @IsOptional()
    estado?: EstadoReconexion;

    @ApiPropertyOptional({
        example: '2026-05-01',
        description: 'Fecha programada desde',
    })
    @IsDateString()
    @IsOptional()
    fechaDesde?: string;

    @ApiPropertyOptional({
        example: '2026-05-31',
        description: 'Fecha programada hasta',
    })
    @IsDateString()
    @IsOptional()
    fechaHasta?: string;

    @ApiPropertyOptional({
        example: 'CLI-0001',
        description: 'Buscar por código cliente, CI, nombre u observación',
    })
    @IsString()
    @IsOptional()
    buscar?: string;
}