import { ConfigurableModuleBuilder, Module } from '@nestjs/common';
import { PaymentService } from './payment.service';

import Stripe from 'stripe';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './payment.schema';
import { Avocat, AvocatSchema } from 'src/advocate/advocate.schema';

export interface StripeModuleOptions {
  apiKey: string;
  options: Stripe.StripeConfig;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<StripeModuleOptions>()
    .setClassMethodName('forRoot')
    .build();

@Module({
  providers: [PaymentService],
  exports: [PaymentService],
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    MongooseModule.forFeature([{ name: Avocat.name, schema: AvocatSchema }]),
  ],
  controllers: [PaymentController],
})
export class PaymentModule extends ConfigurableModuleClass {}
