import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Holding extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  asset: string;

  @Prop({ required: true })
  quantity: number;
}

export const HoldingSchema = SchemaFactory.createForClass(Holding);
HoldingSchema.index({ userId: 1, asset: 1 }, { unique: true });
