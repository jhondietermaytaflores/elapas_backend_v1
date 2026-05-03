import { PartialType } from '@nestjs/swagger';
import { CreateCorteDto } from './create-corte.dto';

export class UpdateCorteDto extends PartialType(CreateCorteDto) {}