import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HoldingsService } from './holdings.service';
import { HoldingsController } from './holdings.controller';
import { Holding, HoldingSchema } from './schemas/holding.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Holding.name, schema: HoldingSchema }])],
  controllers: [HoldingsController],
  providers: [HoldingsService],
  exports: [HoldingsService],
})
export class HoldingsModule {}
