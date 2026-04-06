import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigModule } from './config/config.module';
import { PriceIngestionModule } from './price-ingestion/price-ingestion.module';
import { HoldingsModule } from './holdings/holdings.module';
import { NavEngineModule } from './nav-engine/nav-engine.module';
import { ApiModule } from './api/api.module';
import { RedisModule } from './redis/redis.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    NestConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/shipfinex'),
    ConfigModule,
    RedisModule,
    RabbitMQModule,
    PriceIngestionModule,
    HoldingsModule,
    NavEngineModule,
    ApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
