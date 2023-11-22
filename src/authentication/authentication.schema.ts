import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Login {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: ['client'] })
  role: [string];

  @Prop({ default: true })
  actif: boolean;
}

export const LoginSchema = SchemaFactory.createForClass(Login);
