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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMedidorDto } from './dto/create-medidor.dto';
import { FilterMedidoresDto } from './dto/filter-medidores.dto';
import { UpdateEstadoMedidorDto } from './dto/update-estado-medidor.dto';
import { UpdateMedidorDto } from './dto/update-medidor.dto';
import { MedidoresService } from './medidores.service';

@ApiTags('Medidores')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medidores')
export class MedidoresController {
    constructor(private readonly medidoresService: MedidoresService) { }

    @Roles('ADMIN', 'SUPERVISOR')
    @Post()
    @ApiOperation({ summary: 'Crear medidor y asignarlo a un ciudadano' })
    create(@Body() dto: CreateMedidorDto) {
        return this.medidoresService.create(dto);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get()
    @ApiOperation({ summary: 'Listar medidores con filtros' })
    @ApiQuery({ name: 'estado', required: false, example: 'ACTIVO' })
    @ApiQuery({ name: 'ciudadanoId', required: false, example: 2 })
    @ApiQuery({ name: 'distritoId', required: false, example: 1 })
    @ApiQuery({ name: 'buscar', required: false, example: 'MED-0001' })
    findAll(@Query() filtros: FilterMedidoresDto) {
        return this.medidoresService.findAll(filtros);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get('resumen')
    @ApiOperation({ summary: 'Resumen general de medidores' })
    resumen() {
        return this.medidoresService.resumen();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get('codigo/:codigoMedidor')
    @ApiOperation({ summary: 'Buscar medidor por código interno' })
    @ApiParam({ name: 'codigoMedidor', example: 'MED-0001' })
    findByCodigo(@Param('codigoMedidor') codigoMedidor: string) {
        return this.medidoresService.findByCodigo(codigoMedidor);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get('serie/:numeroSerie')
    @ApiOperation({ summary: 'Buscar medidor por número de serie' })
    @ApiParam({ name: 'numeroSerie', example: '00012345' })
    findBySerie(@Param('numeroSerie') numeroSerie: string) {
        return this.medidoresService.findBySerie(numeroSerie);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get('ciudadano/:usuarioId')
    @ApiOperation({ summary: 'Listar medidores por ciudadano' })
    @ApiParam({ name: 'usuarioId', example: 2 })
    findByCiudadano(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.medidoresService.findByCiudadano(usuarioId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get(':id')
    @ApiOperation({ summary: 'Obtener medidor por ID' })
    @ApiParam({ name: 'id', example: 1 })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.medidoresService.findOne(id);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar medidor' })
    @ApiParam({ name: 'id', example: 1 })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateMedidorDto,
    ) {
        return this.medidoresService.update(id, dto);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id/estado')
    @ApiOperation({ summary: 'Actualizar estado del medidor' })
    @ApiParam({ name: 'id', example: 1 })
    updateEstado(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateEstadoMedidorDto,
    ) {
        return this.medidoresService.updateEstado(id, dto);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id/reasignar/:usuarioId')
    @ApiOperation({ summary: 'Reasignar medidor a otro ciudadano' })
    @ApiParam({ name: 'id', example: 1 })
    @ApiParam({ name: 'usuarioId', example: 5 })
    reasignar(
        @Param('id', ParseIntPipe) id: number,
        @Param('usuarioId', ParseIntPipe) usuarioId: number,
    ) {
        return this.medidoresService.reasignar(id, usuarioId);
    }

    @Roles('ADMIN')
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar medidor sin lecturas registradas' })
    @ApiParam({ name: 'id', example: 1 })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.medidoresService.remove(id);
    }
}