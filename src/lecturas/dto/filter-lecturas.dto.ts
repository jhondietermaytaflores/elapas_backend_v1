import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { EstadoLectura } from '../../generated/prisma/enums';

export class FilterLecturasDto {
    @ApiPropertyOptional({
        example: 1,
        description: 'Filtrar por ID del medidor',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    medidorId?: number;

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
        description: 'Filtrar por ID del técnico',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    tecnicoId?: number;

    @ApiPropertyOptional({
        example: '2026-05',
        description: 'Filtrar por periodo YYYY-MM',
    })
    @IsString()
    @IsOptional()
    periodo?: string;

    @ApiPropertyOptional({
        example: EstadoLectura.REGISTRADA,
        enum: EstadoLectura,
        description: 'Filtrar por estado de lectura',
    })
    @IsEnum(EstadoLectura)
    @IsOptional()
    estado?: EstadoLectura;

    @ApiPropertyOptional({
        example: 'MED-0001',
        description: 'Buscar por medidor, serie, código cliente, CI o nombre',
    })
    @IsString()
    @IsOptional()
    buscar?: string;
}