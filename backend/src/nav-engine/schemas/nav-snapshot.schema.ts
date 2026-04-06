import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class NavSnapshot extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  totalNav: number;

  @Prop({ type: Object })
  assetPrices: Record<string, number>;
}

export const NavSnapshotSchema = SchemaFactory.createForClass(NavSnapshot);
