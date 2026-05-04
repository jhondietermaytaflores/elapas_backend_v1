import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuditoriasService } from './auditorias.service';
import { FilterAuditoriasDto } from './dto/filter-auditorias.dto';

@ApiTags('Auditorías')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auditorias')
export class AuditoriasController {
    constructor(private readonly auditoriasService: AuditoriasService) { }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get()
    @ApiOperation({ summary: 'Listar auditorías con filtros' })
    @ApiQuery({ name: 'usuarioId', required: false, example: 1 })
    @ApiQuery({ name: 'accion', required: false, example: 'CREAR' })
    @ApiQuery({ name: 'entidad', required: false, example: 'Factura' })
    @ApiQuery({ name: 'entidadId', required: false, example: 10 })
    @ApiQuery({ name: 'fechaDesde', required: false, example: '2026-05-01' })
    @ApiQuery({ name: 'fechaHasta', required: false, example: '2026-05-31' })
    @ApiQuery({ name: 'buscar', required: false, example: 'pago' })
    findAll(@Query() filtros: FilterAuditoriasDto) {
        return this.auditoriasService.findAll(filtros);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get('resumen')
    @ApiOperation({ summary: 'Resumen de auditorías' })
    resumen() {
        return this.auditoriasService.resumen();
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get('usuario/:usuarioId')
    @ApiOperation({ summary: 'Listar auditorías por usuario' })
    @ApiParam({ name: 'usuarioId', example: 1 })
    findByUsuario(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.auditoriasService.findByUsuario(usuarioId);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get('entidad/:entidad')
    @ApiOperation({ summary: 'Listar auditorías por entidad' })
    @ApiParam({ name: 'entidad', example: 'Factura' })
    findByEntidad(@Param('entidad') entidad: string) {
        return this.auditoriasService.findByEntidad(entidad);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get(':id')
    @ApiOperation({ summary: 'Obtener auditoría por ID' })
    @ApiParam({ name: 'id', example: 1 })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.auditoriasService.findOne(id);
    }
}