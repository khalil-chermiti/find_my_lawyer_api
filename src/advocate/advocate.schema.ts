import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Login } from './../authentication/authentication.schema';

@Schema()
export class Avocat extends Document {
  @Prop({ required: true })
  prenom: string;

  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false, default: '' })
  bio: string;

  @Prop({ required: false, default: '' })
  photoDeProfile: string;

  @Prop({ required: false, default: '' })
  telephone: string;

  @Prop({ default: false })
  verifie: boolean;

  @Prop({ required: false, default: '' })
  infosVerification: string;

  @Prop({ required: false, default: -1 })
  ansExperience: number;

  @Prop({ default: false })
  aideJuridique: boolean;

  @Prop({ default: false })
  active: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Login' })
  login: Login;

  @Prop({ required: false, default: '' })
  ville: string;

  @Prop({ required: false, default: [] })
  specialite: string;
}

export const AvocatSchema = SchemaFactory.createForClass(Avocat);
