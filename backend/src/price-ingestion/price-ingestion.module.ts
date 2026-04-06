import { Module } from '@nestjs/common';
import { PriceIngestionService } from './price-ingestion.service';

@Module({
  providers: [PriceIngestionService]
})
export class PriceIngestionModule {}
