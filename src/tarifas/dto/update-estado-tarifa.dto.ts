import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateEstadoTarifaDto {
    @ApiProperty({
        example: false,
        description: 'Nuevo estado de la tarifa',
    })
    @IsBoolean()
    activo!: boolean;
}