import { PartialType } from '@nestjs/swagger';
import { CreateCiudadanoDesdeUsuarioDto } from './create-ciudadano-desde-usuario.dto';

export class UpdateCiudadanoDto extends PartialType(
    CreateCiudadanoDesdeUsuarioDto,
) { }