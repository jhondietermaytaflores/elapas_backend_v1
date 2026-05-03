import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateDistritoDto {
    @ApiProperty({
        example: 'Distrito 6',
        description: 'Nombre del distrito o zona',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    nombre!: string;

    @ApiPropertyOptional({
        example: 'Zona de expansión urbana de Sucre.',
        description: 'Descripción del distrito',
    })
    @IsString()
    @IsOptional()
    descripcion?: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Estado activo/inactivo del distrito',
    })
    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}