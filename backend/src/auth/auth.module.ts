import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseService } from 'src/database/database.service';
import { JwtStrategy } from './jwt-strategy';
import {ConfigService,ConfigModule} from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
@Module({
  imports:[PassportModule,JwtModule.registerAsync({imports:[ConfigModule],inject:[ConfigService],useFactory:async (configService:ConfigService)=>({
    secret:configService.get<string>('JWT_SECRET') || 'secret',
    signOptions:{expiresIn:'30d'},
  })
})
],
  controllers: [AuthController],
  providers: [AuthService,DatabaseService,JwtStrategy],
  exports:[AuthService]
})
export class AuthModule {}
