import { Controller, Get, Query } from '@nestjs/common';
import {
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ConsultaPublicaService } from './consulta-publica.service';
import { ConsultaDeudaDto } from './dto/consulta-deuda.dto';

@ApiTags('Consulta Pública')
@Public()
@Controller('consulta-publica')
export class ConsultaPublicaController {
    constructor(
        private readonly consultaPublicaService: ConsultaPublicaService,
    ) { }

    @Get('cliente')
    @ApiOperation({
        summary: 'Consultar datos básicos de cliente por CI o código cliente',
    })
    @ApiQuery({ name: 'ci', required: false, example: '7458392' })
    @ApiQuery({ name: 'codigoCliente', required: false, example: 'CLI-0001' })
    consultarCliente(@Query() dto: ConsultaDeudaDto) {
        return this.consultaPublicaService.consultarCliente(dto);
    }

    @Get('deuda')
    @ApiOperation({
        summary: 'Consultar deuda pendiente por CI o código cliente',
    })
    @ApiQuery({ name: 'ci', required: false, example: '7458392' })
    @ApiQuery({ name: 'codigoCliente', required: false, example: 'CLI-0001' })
    consultarDeuda(@Query() dto: ConsultaDeudaDto) {
        return this.consultaPublicaService.consultarDeuda(dto);
    }

    @Get('facturas')
    @ApiOperation({
        summary: 'Consultar historial básico de facturas por CI o código cliente',
    })
    @ApiQuery({ name: 'ci', required: false, example: '7458392' })
    @ApiQuery({ name: 'codigoCliente', required: false, example: 'CLI-0001' })
    consultarFacturas(@Query() dto: ConsultaDeudaDto) {
        return this.consultaPublicaService.consultarFacturas(dto);
    }

    @Get('estado-servicio')
    @ApiOperation({
        summary: 'Verificar estado del servicio y deuda resumida',
    })
    @ApiQuery({ name: 'ci', required: false, example: '7458392' })
    @ApiQuery({ name: 'codigoCliente', required: false, example: 'CLI-0001' })
    verificarEstadoServicio(@Query() dto: ConsultaDeudaDto) {
        return this.consultaPublicaService.verificarEstadoServicio(dto);
    }
}