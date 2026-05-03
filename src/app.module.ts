import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MedidoresModule } from './medidores/medidores.module';
import { CiudadanosModule } from './ciudadanos/ciudadanos.module';
import { MetodosPagoModule } from './metodos-pago/metodos-pago.module';
import { CategoriasTarifaModule } from './categorias-tarifa/categorias-tarifa.module';
import { DistritosModule } from './distritos/distritos.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { LecturasModule } from './lecturas/lecturas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    RolesModule,
    UsuariosModule,
    DistritosModule,
    CategoriasTarifaModule,
    MetodosPagoModule,
    CiudadanosModule,
    MedidoresModule,
    LecturasModule,
  ],
})
export class AppModule {}
