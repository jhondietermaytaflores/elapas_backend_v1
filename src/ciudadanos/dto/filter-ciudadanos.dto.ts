import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { EstadoServicio } from '../../generated/prisma/enums';

export class FilterCiudadanosDto {
    @ApiPropertyOptional({
        example: 1,
        description: 'Filtrar por ID de distrito',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    distritoId?: number;

    @ApiPropertyOptional({
        example: 1,
        description: 'Filtrar por ID de categoría tarifaria',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    categoriaId?: number;

    @ApiPropertyOptional({
        example: EstadoServicio.ACTIVO,
        enum: EstadoServicio,
        description: 'Filtrar por estado de servicio',
    })
    @IsEnum(EstadoServicio)
    @IsOptional()
    estadoServicio?: EstadoServicio;

    @ApiPropertyOptional({
        example: 'María',
        description: 'Buscar por nombre, apellido, CI o código de cliente',
    })
    @IsString()
    @IsOptional()
    buscar?: string;
}