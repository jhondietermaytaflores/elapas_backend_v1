import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateCategoriaTarifaDto {
    @ApiProperty({
        example: 'INDUSTRIAL',
        description: 'Nombre único de la categoría tarifaria',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    nombre!: string;

    @ApiPropertyOptional({
        example: 'Categoría para industrias o alto consumo.',
        description: 'Descripción de la categoría',
    })
    @IsString()
    @IsOptional()
    descripcion?: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Estado activo/inactivo',
    })
    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}