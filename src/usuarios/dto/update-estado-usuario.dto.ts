import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateEstadoUsuarioDto {
    @ApiProperty({
        example: false,
        description: 'Nuevo estado del usuario',
    })
    @IsBoolean()
    activo!: boolean;
}