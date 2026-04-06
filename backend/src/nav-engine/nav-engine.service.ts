import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Redis from 'ioredis';
import { ClientProxy } from '@nestjs/microservices';
import { HoldingsService } from '../holdings/holdings.service';
import { NavSnapshot } from './schemas/nav-snapshot.schema';
import { Alert } from './schemas/alert.schema';

@Injectable()
export class NavEngineService {
  private readonly logger = new Logger(NavEngineService.name);

  constructor(
    @InjectModel(NavSnapshot.name) private navSnapshotModel: Model<NavSnapshot>,
    @InjectModel(Alert.name) private alertModel: Model<Alert>,
    private readonly holdingsService: HoldingsService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {}

  async processPriceUpdate(asset: string, price: number) {
    const affectedUsers = await this.holdingsService.getUsersHoldingAsset(asset);

    for (const userId of affectedUsers) {
      await this.computeNavForUser(userId);
    }
  }

  private normalizeAsset(asset: string): string {
    const mapping: Record<string, string> = {
      btc: 'bitcoin',
      eth: 'ethereum',
      usdt: 'tether',
      doge: 'dogecoin',
      ada: 'cardano',
      avax: 'avalanche',
      ltc: 'litecoin',
      xmr: 'monero',
    };
    const lowerAsset = asset.toLowerCase();
    return mapping[lowerAsset] || lowerAsset;
  }

  async computeNavForUser(userId: string) {
    const holdings = await this.holdingsService.getHoldingsByUser(userId);

    let totalNav = 0;
    const assetPrices: Record<string, number> = {};

    if (holdings.length > 0) {
      const keys = holdings.map(h => `latest_price:${this.normalizeAsset(h.asset)}`);
      const prices = await this.redis.mget(...keys);

      holdings.forEach((holding, index) => {
        const price = prices[index] ? parseFloat(prices[index]) : 0;
        assetPrices[holding.asset] = price;
        totalNav += holding.quantity * price;
      });
    }

    const snapshot = new this.navSnapshotModel({
      userId,
      totalNav,
      assetPrices,
    });
    await snapshot.save();

    this.rabbitClient.emit('nav.calculated', {
      userId,
      totalNav,
      assetPrices,
      timestamp: Date.now(),
    });

    await this.evaluateAlerts(userId, totalNav);
  }

  private async evaluateAlerts(userId: string, currentNav: number) {
    const pendingAlerts = await this.alertModel.find({ userId, isTriggered: false }).exec();

    for (const alert of pendingAlerts) {
      let triggered = false;
      if (alert.direction === 'above' && currentNav >= alert.targetNav) {
        triggered = true;
      } else if (alert.direction === 'below' && currentNav <= alert.targetNav) {
        triggered = true;
      }

      if (triggered) {
        alert.isTriggered = true;
        await alert.save();

        this.rabbitClient.emit('alert.triggered', {
          alertId: alert._id,
          userId,
          targetNav: alert.targetNav,
          currentNav,
          direction: alert.direction,
          timestamp: Date.now(),
        });

        this.logger.log(`Alert triggered for user ${userId}: NAV crossed ${alert.direction} ${alert.targetNav}`);
      }
    }
  }
}
