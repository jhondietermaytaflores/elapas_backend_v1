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
import { CiudadanosService } from './ciudadanos.service';
import { CreateCiudadanoConUsuarioDto } from './dto/create-ciudadano-con-usuario.dto';
import { CreateCiudadanoDesdeUsuarioDto } from './dto/create-ciudadano-desde-usuario.dto';
import { CreateMedidorCiudadanoDto } from './dto/create-medidor-ciudadano.dto';
import { FilterCiudadanosDto } from './dto/filter-ciudadanos.dto';
import { UpdateCiudadanoDto } from './dto/update-ciudadano.dto';
import { UpdateEstadoServicioDto } from './dto/update-estado-servicio.dto';

@ApiTags('Ciudadanos / Catastro')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ciudadanos')
export class CiudadanosController {
    constructor(private readonly ciudadanosService: CiudadanosService) { }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Post('desde-usuario')
    @ApiOperation({
        summary: 'Registrar datos catastrales desde un usuario existente',
    })
    createDesdeUsuario(@Body() dto: CreateCiudadanoDesdeUsuarioDto) {
        return this.ciudadanosService.createDesdeUsuario(dto);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Post('con-usuario')
    @ApiOperation({
        summary: 'Crear usuario ciudadano y datos catastrales en una transacción',
    })
    createConUsuario(@Body() dto: CreateCiudadanoConUsuarioDto) {
        return this.ciudadanosService.createConUsuario(dto);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get()
    @ApiOperation({
        summary: 'Listar ciudadanos con filtros',
    })
    @ApiQuery({ name: 'distritoId', required: false, example: 1 })
    @ApiQuery({ name: 'categoriaId', required: false, example: 1 })
    @ApiQuery({ name: 'estadoServicio', required: false, example: 'ACTIVO' })
    @ApiQuery({ name: 'buscar', required: false, example: 'María' })
    findAll(@Query() filtros: FilterCiudadanosDto) {
        return this.ciudadanosService.findAll(filtros);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('resumen')
    @ApiOperation({
        summary: 'Obtener resumen general de ciudadanos y medidores',
    })
    resumen() {
        return this.ciudadanosService.resumen();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('disponibles-para-catastro')
    @ApiOperation({
        summary:
            'Listar usuarios con rol CIUDADANO que todavía no tienen datos catastrales',
    })
    disponiblesParaCatastro() {
        return this.ciudadanosService.disponiblesParaCatastro();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get('codigo/:codigoCliente')
    @ApiOperation({
        summary: 'Buscar ciudadano por código de cliente',
    })
    @ApiParam({ name: 'codigoCliente', example: 'CLI-0001' })
    findByCodigo(@Param('codigoCliente') codigoCliente: string) {
        return this.ciudadanosService.findByCodigo(codigoCliente);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get(':usuarioId')
    @ApiOperation({
        summary: 'Obtener ciudadano por usuarioId',
    })
    @ApiParam({ name: 'usuarioId', example: 2 })
    findOne(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.ciudadanosService.findOne(usuarioId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Patch(':usuarioId')
    @ApiOperation({
        summary: 'Actualizar datos catastrales del ciudadano',
    })
    @ApiParam({ name: 'usuarioId', example: 2 })
    update(
        @Param('usuarioId', ParseIntPipe) usuarioId: number,
        @Body() dto: UpdateCiudadanoDto,
    ) {
        return this.ciudadanosService.update(usuarioId, dto);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':usuarioId/estado-servicio')
    @ApiOperation({
        summary: 'Actualizar estado del servicio del ciudadano',
    })
    @ApiParam({ name: 'usuarioId', example: 2 })
    updateEstadoServicio(
        @Param('usuarioId', ParseIntPipe) usuarioId: number,
        @Body() dto: UpdateEstadoServicioDto,
    ) {
        return this.ciudadanosService.updateEstadoServicio(usuarioId, dto);
    }

    @Roles('ADMIN')
    @Delete(':usuarioId')
    @ApiOperation({
        summary: 'Eliminar registro ciudadano si no tiene relaciones operativas',
    })
    @ApiParam({ name: 'usuarioId', example: 2 })
    remove(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.ciudadanosService.remove(usuarioId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get(':usuarioId/medidores')
    @ApiOperation({
        summary: 'Listar medidores asociados a un ciudadano',
    })
    @ApiParam({ name: 'usuarioId', example: 2 })
    findMedidores(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.ciudadanosService.findMedidores(usuarioId);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Post(':usuarioId/medidores')
    @ApiOperation({
        summary: 'Asignar nuevo medidor a un ciudadano',
    })
    @ApiParam({ name: 'usuarioId', example: 2 })
    createMedidor(
        @Param('usuarioId', ParseIntPipe) usuarioId: number,
        @Body() dto: CreateMedidorCiudadanoDto,
    ) {
        return this.ciudadanosService.createMedidor(usuarioId, dto);
    }
}