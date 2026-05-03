import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { EstadoCorte } from '../../generated/prisma/enums';

export class FilterCortesDto {
    @ApiPropertyOptional({
        example: 2,
        description: 'Filtrar por usuarioId del ciudadano',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    ciudadanoId?: number;

    @ApiPropertyOptional({
        example: 3,
        description: 'Filtrar por técnico asignado',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    tecnicoId?: number;

    @ApiPropertyOptional({
        example: EstadoCorte.PENDIENTE,
        enum: EstadoCorte,
        description: 'Filtrar por estado del corte',
    })
    @IsEnum(EstadoCorte)
    @IsOptional()
    estado?: EstadoCorte;

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
        description: 'Buscar por código cliente, CI, nombre o motivo',
    })
    @IsString()
    @IsOptional()
    buscar?: string;
}