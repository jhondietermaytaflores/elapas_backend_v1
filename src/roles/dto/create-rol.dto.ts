import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRolDto {
    @ApiProperty({
        example: 'OPERADOR',
        description: 'Nombre único del rol dentro del sistema',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    nombre!: string;
}