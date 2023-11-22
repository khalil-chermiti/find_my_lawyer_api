import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { DatabaseModule } from './common/database/database.module';
import { AdvocateModule } from './advocate/advocate.module';
import { ClientModule } from './client/client.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        ignoreTLS: true,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
    }),
    JwtModule.register({
      global: true,
      secret: 'this_is_a_secret_key',
      signOptions: { expiresIn: '1d' },
    }),
    AuthenticationModule,
    AdvocateModule,
    ClientModule,
  ],
})
export class AppModule {}
