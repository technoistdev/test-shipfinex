import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis(process.env.REDIS_URI || 'redis://localhost:6379');
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
