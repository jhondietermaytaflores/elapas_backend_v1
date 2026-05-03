import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateMetodoPagoDto {
    @ApiProperty({
        example: 'BANCA_MOVIL',
        description: 'Nombre único del método de pago',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    nombre!: string;

    @ApiPropertyOptional({
        example: 'Pago mediante aplicación bancaria móvil.',
        description: 'Descripción del método de pago',
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