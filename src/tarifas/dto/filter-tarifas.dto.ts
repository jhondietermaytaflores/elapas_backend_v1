import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class FilterTarifasDto {
    @ApiPropertyOptional({
        example: 1,
        description: 'Filtrar por categoría tarifaria',
    })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    categoriaId?: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Filtrar por estado activo/inactivo',
    })
    @Type(() => Boolean)
    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}