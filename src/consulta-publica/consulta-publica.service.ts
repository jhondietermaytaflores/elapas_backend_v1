import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { EstadoFactura } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ConsultaDeudaDto } from './dto/consulta-deuda.dto';

@Injectable()
export class ConsultaPublicaService {
    constructor(private readonly prisma: PrismaService) { }

    private validarParametros(dto: ConsultaDeudaDto) {
        const ci = dto.ci?.trim();
        const codigoCliente = dto.codigoCliente?.trim().toUpperCase();

        if (!ci && !codigoCliente) {
            throw new BadRequestException(
                'Debe enviar ci o codigoCliente para realizar la consulta',
            );
        }

        return {
            ci,
            codigoCliente,
        };
    }

    private async buscarCiudadano(dto: ConsultaDeudaDto) {
        const { ci, codigoCliente } = this.validarParametros(dto);

        const ciudadano = await this.prisma.ciudadano.findFirst({
            where: {
                OR: [
                    ci
                        ? {
                            usuario: {
                                ci,
                            },
                        }
                        : undefined,
                    codigoCliente
                        ? {
                            codigoCliente,
                        }
                        : undefined,
                ].filter(Boolean) as any,
            },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        ci: true,
                        telefono: true,
                        activo: true,
                    },
                },
                categoria: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true,
                    },
                },
                distrito: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
                medidores: {
                    select: {
                        id: true,
                        codigoMedidor: true,
                        numeroSerie: true,
                        estado: true,
                    },
                },
            },
        });

        if (!ciudadano) {
            throw new NotFoundException('No se encontró un ciudadano con esos datos');
        }

        if (!ciudadano.usuario.activo) {
            throw new BadRequestException('El ciudadano se encuentra inactivo');
        }

        return ciudadano;
    }

    async consultarCliente(dto: ConsultaDeudaDto) {
        const ciudadano = await this.buscarCiudadano(dto);

        return {
            codigoCliente: ciudadano.codigoCliente,
            estadoServicio: ciudadano.estadoServicio,
            usuario: {
                nombre: ciudadano.usuario.nombre,
                apellido: ciudadano.usuario.apellido,
                ci: ciudadano.usuario.ci,
            },
            categoria: ciudadano.categoria,
            distrito: ciudadano.distrito,
            direccion: ciudadano.direccion,
            medidores: ciudadano.medidores,
        };
    }

    async consultarDeuda(dto: ConsultaDeudaDto) {
        const ciudadano = await this.buscarCiudadano(dto);

        const facturas = await this.prisma.factura.findMany({
            where: {
                ciudadanoId: ciudadano.usuarioId,
                estado: {
                    in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                },
            },
            select: {
                id: true,
                numeroFactura: true,
                periodo: true,
                consumoM3: true,
                montoAgua: true,
                cargoFijo: true,
                multa: true,
                montoTotal: true,
                estado: true,
                fechaEmision: true,
                fechaVencimiento: true,
                detalles: {
                    select: {
                        descripcion: true,
                        cantidad: true,
                        precioUnitario: true,
                        subtotal: true,
                    },
                },
                lectura: {
                    select: {
                        id: true,
                        periodo: true,
                        lecturaAnterior: true,
                        lecturaActual: true,
                        consumoM3: true,
                        medidor: {
                            select: {
                                id: true,
                                codigoMedidor: true,
                                numeroSerie: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                fechaVencimiento: 'asc',
            },
        });

        const totalDeuda = facturas.reduce((acc, factura) => {
            return acc + Number(factura.montoTotal);
        }, 0);

        return {
            ciudadano: {
                usuarioId: ciudadano.usuarioId,
                codigoCliente: ciudadano.codigoCliente,
                nombre: ciudadano.usuario.nombre,
                apellido: ciudadano.usuario.apellido,
                ci: ciudadano.usuario.ci,
                estadoServicio: ciudadano.estadoServicio,
                categoria: ciudadano.categoria.nombre,
                distrito: ciudadano.distrito.nombre,
            },
            deuda: {
                totalDeuda,
                cantidadFacturas: facturas.length,
            },
            facturas,
        };
    }

    async consultarFacturas(dto: ConsultaDeudaDto) {
        const ciudadano = await this.buscarCiudadano(dto);

        const facturas = await this.prisma.factura.findMany({
            where: {
                ciudadanoId: ciudadano.usuarioId,
            },
            select: {
                id: true,
                numeroFactura: true,
                periodo: true,
                consumoM3: true,
                montoTotal: true,
                estado: true,
                fechaEmision: true,
                fechaVencimiento: true,
                pago: {
                    select: {
                        id: true,
                        codigoPago: true,
                        montoPagado: true,
                        estado: true,
                        fechaPago: true,
                        metodo: {
                            select: {
                                nombre: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                fechaEmision: 'desc',
            },
        });

        return {
            ciudadano: {
                usuarioId: ciudadano.usuarioId,
                codigoCliente: ciudadano.codigoCliente,
                nombre: ciudadano.usuario.nombre,
                apellido: ciudadano.usuario.apellido,
                ci: ciudadano.usuario.ci,
            },
            facturas,
        };
    }

    async verificarEstadoServicio(dto: ConsultaDeudaDto) {
        const ciudadano = await this.buscarCiudadano(dto);

        const deuda = await this.prisma.factura.aggregate({
            where: {
                ciudadanoId: ciudadano.usuarioId,
                estado: {
                    in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                },
            },
            _sum: {
                montoTotal: true,
            },
            _count: {
                id: true,
            },
        });

        return {
            codigoCliente: ciudadano.codigoCliente,
            nombre: ciudadano.usuario.nombre,
            apellido: ciudadano.usuario.apellido,
            ci: ciudadano.usuario.ci,
            estadoServicio: ciudadano.estadoServicio,
            tieneDeuda: deuda._count.id > 0,
            cantidadFacturasPendientes: deuda._count.id,
            totalDeuda: Number(deuda._sum.montoTotal ?? 0),
        };
    }

    //news consultas 

    async consultarMedidores(dto: ConsultaDeudaDto) {
        const ciudadano = await this.buscarCiudadano(dto);

        const medidores = await this.prisma.medidor.findMany({
            where: {
                ciudadanoId: ciudadano.usuarioId,
            },
            select: {
                id: true,
                codigoMedidor: true,
                numeroSerie: true,
                marca: true,
                modelo: true,
                fechaInstalacion: true,
                lecturaInicial: true,
                estado: true,
                _count: {
                    select: {
                        lecturas: true,
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        });

        return {
            ciudadano: {
                codigoCliente: ciudadano.codigoCliente,
                nombre: ciudadano.usuario.nombre,
                apellido: ciudadano.usuario.apellido,
                ci: ciudadano.usuario.ci,
                estadoServicio: ciudadano.estadoServicio,
            },
            medidores,
        };
    }

    async consultarLecturas(dto: ConsultaDeudaDto) {
        const ciudadano = await this.buscarCiudadano(dto);

        const lecturas = await this.prisma.lectura.findMany({
            where: {
                medidor: {
                    ciudadanoId: ciudadano.usuarioId,
                },
            },
            select: {
                id: true,
                periodo: true,
                lecturaAnterior: true,
                lecturaActual: true,
                consumoM3: true,
                fechaLectura: true,
                estado: true,
                medidor: {
                    select: {
                        id: true,
                        codigoMedidor: true,
                        numeroSerie: true,
                    },
                },
                factura: {
                    select: {
                        id: true,
                        numeroFactura: true,
                        estado: true,
                        montoTotal: true,
                        fechaVencimiento: true,
                    },
                },
            },
            orderBy: {
                fechaLectura: 'desc',
            },
        });

        return {
            ciudadano: {
                codigoCliente: ciudadano.codigoCliente,
                nombre: ciudadano.usuario.nombre,
                apellido: ciudadano.usuario.apellido,
                ci: ciudadano.usuario.ci,
                estadoServicio: ciudadano.estadoServicio,
            },
            lecturas,
        };
    }

    async consultarLecturasPorMedidor(
        medidorId: number,
        dto: ConsultaDeudaDto,
    ) {
        const ciudadano = await this.buscarCiudadano(dto);

        const medidor = await this.prisma.medidor.findFirst({
            where: {
                id: medidorId,
                ciudadanoId: ciudadano.usuarioId,
            },
            select: {
                id: true,
                codigoMedidor: true,
                numeroSerie: true,
                marca: true,
                modelo: true,
                estado: true,
            },
        });

        if (!medidor) {
            throw new NotFoundException(
                'Medidor no encontrado para los datos ingresados',
            );
        }

        const lecturas = await this.prisma.lectura.findMany({
            where: {
                medidorId,
            },
            select: {
                id: true,
                periodo: true,
                lecturaAnterior: true,
                lecturaActual: true,
                consumoM3: true,
                fechaLectura: true,
                estado: true,
                factura: {
                    select: {
                        id: true,
                        numeroFactura: true,
                        estado: true,
                        montoTotal: true,
                        fechaVencimiento: true,
                    },
                },
            },
            orderBy: {
                fechaLectura: 'desc',
            },
        });

        return {
            ciudadano: {
                codigoCliente: ciudadano.codigoCliente,
                nombre: ciudadano.usuario.nombre,
                apellido: ciudadano.usuario.apellido,
                ci: ciudadano.usuario.ci,
            },
            medidor,
            lecturas,
        };
    }
}