import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Login, LoginSchema } from './authentication.schema';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { JwtModule } from '@nestjs/jwt';
import { HashingService } from './hashing.service';
import { ConfigService } from '@nestjs/config';
import { Avocat, AvocatSchema } from './../advocate/advocate.schema';
import { Client, ClientSchema } from './../client/client.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Login.name, schema: LoginSchema }]),
    MongooseModule.forFeature([{ name: Avocat.name, schema: AvocatSchema }]),
    MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [AuthenticationService, HashingService],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
