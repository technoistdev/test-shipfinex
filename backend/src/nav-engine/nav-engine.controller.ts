import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NavEngineService } from './nav-engine.service';

@Controller()
export class NavEngineController {
  constructor(private readonly navEngineService: NavEngineService) {}

  @EventPattern('price.updated')
  async handlePriceUpdated(@Payload() data: { asset: string; price: number; timestamp: number }) {
    await this.navEngineService.processPriceUpdate(data.asset, data.price);
  }

  @EventPattern('holding.updated')
  async handleHoldingUpdated(@Payload() data: { userId: string }) {
    await this.navEngineService.computeNavForUser(data.userId);
  }
}
