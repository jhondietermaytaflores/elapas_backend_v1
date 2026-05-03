import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EstadoServicio } from '../../generated/prisma/enums';

export class UpdateEstadoServicioDto {
    @ApiProperty({
        example: EstadoServicio.CORTADO,
        enum: EstadoServicio,
        description: 'Nuevo estado del servicio',
    })
    @IsEnum(EstadoServicio)
    estadoServicio!: EstadoServicio;
}