import { PartialType } from '@nestjs/swagger';
import { CreateLecturaDto } from './create-lectura.dto';

export class UpdateLecturaDto extends PartialType(CreateLecturaDto) {}