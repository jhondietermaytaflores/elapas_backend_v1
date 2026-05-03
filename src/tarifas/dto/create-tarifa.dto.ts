import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    Min,
} from 'class-validator';

export class CreateTarifaDto {
    @ApiProperty({
        example: 1,
        description: 'ID de la categoría tarifaria',
    })
    @IsInt()
    categoriaId!: number;

    @ApiProperty({
        example: 0,
        description: 'Rango mínimo de consumo en m3',
    })
    @IsNumber()
    @Min(0)
    rangoDesde!: number;

    @ApiPropertyOptional({
        example: 10,
        description:
            'Rango máximo de consumo en m3. Si es null, representa consumo ilimitado hacia arriba.',
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    rangoHasta?: number;

    @ApiProperty({
        example: 2.5,
        description: 'Precio por metro cúbico',
    })
    @IsNumber()
    @Min(0)
    precioM3!: number;

    @ApiPropertyOptional({
        example: 10,
        description: 'Cargo fijo aplicado a la factura',
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    cargoFijo?: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Estado activo/inactivo de la tarifa',
    })
    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}