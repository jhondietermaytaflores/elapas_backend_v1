import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';
import { MetodosPagoService } from './metodos-pago.service';

@ApiTags('Métodos de Pago')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('metodos-pago')
export class MetodosPagoController {
    constructor(private readonly metodosPagoService: MetodosPagoService) { }

    @Roles('ADMIN', 'SUPERVISOR')
    @Post()
    @ApiOperation({ summary: 'Crear método de pago' })
    create(@Body() createDto: CreateMetodoPagoDto) {
        return this.metodosPagoService.create(createDto);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get()
    @ApiOperation({ summary: 'Listar métodos de pago' })
    findAll() {
        return this.metodosPagoService.findAll();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('activos')
    @ApiOperation({ summary: 'Listar métodos de pago activos' })
    findActivos() {
        return this.metodosPagoService.findActivos();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get(':id')
    @ApiOperation({ summary: 'Obtener método de pago por ID' })
    @ApiParam({ name: 'id', example: 1 })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.metodosPagoService.findOne(id);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar método de pago' })
    @ApiParam({ name: 'id', example: 1 })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateMetodoPagoDto,
    ) {
        return this.metodosPagoService.update(id, updateDto);
    }

    @Roles('ADMIN')
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar método de pago sin relaciones' })
    @ApiParam({ name: 'id', example: 1 })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.metodosPagoService.remove(id);
    }
}