import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsController } from './alerts/alerts.controller';
import { NavController } from './nav/nav.controller';
import { StreamController } from './stream/stream.controller';
import { ApiEventConsumer } from './api-event.consumer';
import { HoldingsModule } from '../holdings/holdings.module';
import { NavSnapshot, NavSnapshotSchema } from '../nav-engine/schemas/nav-snapshot.schema';
import { Alert, AlertSchema } from '../nav-engine/schemas/alert.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NavSnapshot.name, schema: NavSnapshotSchema },
      { name: Alert.name, schema: AlertSchema }
    ]),
    HoldingsModule
  ],
  controllers: [AlertsController, NavController, StreamController, ApiEventConsumer],
})
export class ApiModule {}
