import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        example: '1234567',
        description: 'Carnet de identidad del usuario',
    })
    @IsString()
    @IsNotEmpty()
    ci!: string;


    @ApiProperty({
        example: 'admin123',
        description: 'Contraseña del usuario',
    })
    @IsString()
    @IsNotEmpty()
    password!: string;
}