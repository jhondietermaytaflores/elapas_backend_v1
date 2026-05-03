import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { EstadoFactura } from '../../generated/prisma/enums';

export class FilterFacturasDto {
    @ApiPropertyOptional({
        example: 2,
        description: 'Filtrar por usuarioId del ciudadano',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    ciudadanoId?: number;

    @ApiPropertyOptional({
        example: '2026-05',
        description: 'Periodo YYYY-MM',
    })
    @IsString()
    @IsOptional()
    periodo?: string;

    @ApiPropertyOptional({
        example: EstadoFactura.PENDIENTE,
        enum: EstadoFactura,
        description: 'Estado de la factura',
    })
    @IsEnum(EstadoFactura)
    @IsOptional()
    estado?: EstadoFactura;

    @ApiPropertyOptional({
        example: 'CLI-0001',
        description: 'Buscar por número de factura, código cliente, CI o nombre',
    })
    @IsString()
    @IsOptional()
    buscar?: string;
}