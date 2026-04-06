import { Controller, Get, Post, Delete, Body, Query, Param, Inject } from '@nestjs/common';
import { HoldingsService } from './holdings.service';
import { ClientProxy } from '@nestjs/microservices';

@Controller('holdings')
export class HoldingsController {
  constructor(
    private readonly holdingsService: HoldingsService,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {}

  @Post()
  async setHolding(@Body() body: { userId: string; asset: string; quantity: number }) {
    const result = await this.holdingsService.createOrUpdateHolding(body.userId, body.asset, body.quantity);
    this.rabbitClient.emit('holding.updated', { userId: body.userId });
    return result;
  }

  @Get()
  async getHoldings(@Query('userId') userId: string) {
    if (!userId) return [];
    return this.holdingsService.getHoldingsByUser(userId);
  }

  @Delete(':asset')
  async deleteHolding(@Query('userId') userId: string, @Param('asset') asset: string) {
    await this.holdingsService.deleteHolding(userId, asset);
    this.rabbitClient.emit('holding.updated', { userId });
    return { success: true };
  }
}
