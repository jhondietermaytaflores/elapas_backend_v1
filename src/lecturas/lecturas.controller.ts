import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
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
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateLecturaDto } from './dto/create-lectura.dto';
import { FilterLecturasDto } from './dto/filter-lecturas.dto';
import { UpdateLecturaDto } from './dto/update-lectura.dto';
import { LecturasService } from './lecturas.service';

@ApiTags('Lecturas')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lecturas')
export class LecturasController {
    constructor(private readonly lecturasService: LecturasService) { }

    @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
    @Post()
    @ApiOperation({
        summary: 'Registrar lectura de medidor',
        description:
            'Registra una lectura usando el usuario autenticado como técnico responsable.',
    })
    create(@Body() dto: CreateLecturaDto, @GetUser() user: any) {
        return this.lecturasService.create(dto, user.id);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get()
    @ApiOperation({ summary: 'Listar lecturas con filtros' })
    @ApiQuery({ name: 'medidorId', required: false, example: 1 })
    @ApiQuery({ name: 'ciudadanoId', required: false, example: 2 })
    @ApiQuery({ name: 'tecnicoId', required: false, example: 3 })
    @ApiQuery({ name: 'periodo', required: false, example: '2026-05' })
    @ApiQuery({ name: 'estado', required: false, example: 'REGISTRADA' })
    @ApiQuery({ name: 'buscar', required: false, example: 'MED-0001' })
    findAll(@Query() filtros: FilterLecturasDto) {
        return this.lecturasService.findAll(filtros);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get('resumen')
    @ApiOperation({ summary: 'Resumen general de lecturas' })
    resumen() {
        return this.lecturasService.resumen();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get('medidor/:medidorId')
    @ApiOperation({ summary: 'Listar lecturas de un medidor' })
    @ApiParam({ name: 'medidorId', example: 1 })
    findByMedidor(@Param('medidorId', ParseIntPipe) medidorId: number) {
        return this.lecturasService.findByMedidor(medidorId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get('ciudadano/:usuarioId')
    @ApiOperation({ summary: 'Listar lecturas de un ciudadano' })
    @ApiParam({ name: 'usuarioId', example: 2 })
    findByCiudadano(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.lecturasService.findByCiudadano(usuarioId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get('periodo/:periodo')
    @ApiOperation({ summary: 'Listar lecturas por periodo YYYY-MM' })
    @ApiParam({ name: 'periodo', example: '2026-05' })
    findByPeriodo(@Param('periodo') periodo: string) {
        return this.lecturasService.findByPeriodo(periodo);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get(':id')
    @ApiOperation({ summary: 'Obtener lectura por ID' })
    @ApiParam({ name: 'id', example: 1 })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.lecturasService.findOne(id);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar lectura en estado REGISTRADA' })
    @ApiParam({ name: 'id', example: 1 })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateLecturaDto,
    ) {
        return this.lecturasService.update(id, dto);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id/confirmar')
    @ApiOperation({ summary: 'Confirmar lectura para facturación' })
    @ApiParam({ name: 'id', example: 1 })
    confirmar(@Param('id', ParseIntPipe) id: number) {
        return this.lecturasService.confirmar(id);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id/anular')
    @ApiOperation({ summary: 'Anular lectura sin factura asociada' })
    @ApiParam({ name: 'id', example: 1 })
    anular(@Param('id', ParseIntPipe) id: number) {
        return this.lecturasService.anular(id);
    }

    @Roles('ADMIN')
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar lectura sin factura asociada' })
    @ApiParam({ name: 'id', example: 1 })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.lecturasService.remove(id);
    }
}