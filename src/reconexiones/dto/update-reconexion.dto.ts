import { PartialType } from '@nestjs/swagger';
import { CreateReconexionDto } from './create-reconexion.dto';

export class UpdateReconexionDto extends PartialType(CreateReconexionDto) {}