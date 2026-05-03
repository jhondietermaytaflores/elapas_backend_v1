import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { EstadoPago } from '../../generated/prisma/enums';

export class FilterPagosDto {
    @ApiPropertyOptional({
        example: 1,
        description: 'Filtrar por ID de factura',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    facturaId?: number;

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
        description: 'Filtrar por usuario que registró el pago',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    usuarioId?: number;

    @ApiPropertyOptional({
        example: 1,
        description: 'Filtrar por método de pago',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    metodoId?: number;

    @ApiPropertyOptional({
        example: EstadoPago.CONFIRMADO,
        enum: EstadoPago,
        description: 'Filtrar por estado del pago',
    })
    @IsEnum(EstadoPago)
    @IsOptional()
    estado?: EstadoPago;

    @ApiPropertyOptional({
        example: '2026-05-01',
        description: 'Fecha inicial de búsqueda',
    })
    @IsDateString()
    @IsOptional()
    fechaDesde?: string;

    @ApiPropertyOptional({
        example: '2026-05-31',
        description: 'Fecha final de búsqueda',
    })
    @IsDateString()
    @IsOptional()
    fechaHasta?: string;

    @ApiPropertyOptional({
        example: 'ELAPAS-000001',
        description: 'Buscar por código de pago, factura, CI, nombre o código cliente',
    })
    @IsString()
    @IsOptional()
    buscar?: string;
}