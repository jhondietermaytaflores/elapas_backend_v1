import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { EstadoMedidor } from '../../generated/prisma/enums';

export class FilterMedidoresDto {
    @ApiPropertyOptional({
        example: EstadoMedidor.ACTIVO,
        enum: EstadoMedidor,
        description: 'Filtrar por estado del medidor',
    })
    @IsEnum(EstadoMedidor)
    @IsOptional()
    estado?: EstadoMedidor;

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
        description: 'Filtrar por distritoId del ciudadano',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    distritoId?: number;

    @ApiPropertyOptional({
        example: 'MED-0001',
        description: 'Buscar por código, serie, marca, modelo, CI o nombre del ciudadano',
    })
    @IsString()
    @IsOptional()
    buscar?: string;
}