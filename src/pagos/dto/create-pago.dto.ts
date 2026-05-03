import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';
import { EstadoPago } from '../../generated/prisma/enums';

export class CreatePagoDto {
    @ApiProperty({
        example: 1,
        description: 'ID de la factura a pagar',
    })
    @IsInt()
    facturaId!: number;

    @ApiProperty({
        example: 1,
        description: 'ID del método de pago',
    })
    @IsInt()
    metodoId!: number;

    @ApiPropertyOptional({
        example: 'ELAPAS-000001',
        description:
            'Código único del pago. Si no se envía, el sistema lo genera automáticamente.',
    })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    codigoPago?: string;

    @ApiProperty({
        example: 45.3,
        description: 'Monto pagado por el ciudadano',
    })
    @IsNumber()
    @Min(0)
    montoPagado!: number;

    @ApiPropertyOptional({
        example: EstadoPago.CONFIRMADO,
        enum: EstadoPago,
        description: 'Estado del pago',
    })
    @IsEnum(EstadoPago)
    @IsOptional()
    estado?: EstadoPago;

    @ApiPropertyOptional({
        example: 'TXN-QR-2026-0001',
        description: 'Referencia externa de la transacción',
    })
    @IsString()
    @IsOptional()
    @MaxLength(150)
    referenciaTransaccion?: string;

    @ApiPropertyOptional({
        example: 'QR-BO-0001',
        description: 'Referencia QR del pago',
    })
    @IsString()
    @IsOptional()
    qrReferencia?: string;

    @ApiPropertyOptional({
        example: 'Pago registrado en caja central.',
        description: 'Observación del pago',
    })
    @IsString()
    @IsOptional()
    observacion?: string;
}