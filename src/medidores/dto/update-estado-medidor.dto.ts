import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EstadoMedidor } from '../../generated/prisma/enums';

export class UpdateEstadoMedidorDto {
    @ApiProperty({
        example: EstadoMedidor.DANADO,
        enum: EstadoMedidor,
        description: 'Nuevo estado del medidor',
    })
    @IsEnum(EstadoMedidor)
    estado!: EstadoMedidor;
}