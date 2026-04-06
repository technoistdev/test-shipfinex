import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NavEngineService } from './nav-engine.service';
import { NavEngineController } from './nav-engine.controller';
import { NavSnapshot, NavSnapshotSchema } from './schemas/nav-snapshot.schema';
import { Alert, AlertSchema } from './schemas/alert.schema';
import { HoldingsModule } from '../holdings/holdings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NavSnapshot.name, schema: NavSnapshotSchema },
      { name: Alert.name, schema: AlertSchema }
    ]),
    HoldingsModule
  ],
  controllers: [NavEngineController],
  providers: [NavEngineService],
  exports: [NavEngineService],
})
export class NavEngineModule {}
