import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Login } from './../authentication/authentication.schema';

@Schema()
export class Client extends Document {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  prenom: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false })
  phoneNumber: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Login' })
  login: Login;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
