import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Alert extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  targetNav: number;

  @Prop({ required: true, enum: ['above', 'below'] })
  direction: string;

  @Prop({ default: false })
  isTriggered: boolean;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
