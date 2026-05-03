import { PartialType } from '@nestjs/swagger';
import { CreateMedidorDto } from './create-medidor.dto';

export class UpdateMedidorDto extends PartialType(CreateMedidorDto) {}