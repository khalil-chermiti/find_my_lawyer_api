import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Date } from 'mongoose';
import { Avocat } from 'src/advocate/advocate.schema';

@Schema()
export class Payment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Avocat', required: true })
  avocat: Avocat;

  @Prop({ required: true, type: Date })
  date_activation: Date;

  @Prop({ required: true, type: Date })
  date_expiration: Date;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  prix: number;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
