import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Holding } from './schemas/holding.schema';

@Injectable()
export class HoldingsService {
  constructor(
    @InjectModel(Holding.name) private holdingModel: Model<Holding>,
  ) {}

  async createOrUpdateHolding(userId: string, asset: string, quantity: number): Promise<Holding> {
    return this.holdingModel.findOneAndUpdate(
      { userId, asset },
      { quantity },
      { upsert: true, new: true }
    ).exec();
  }

  async getHoldingsByUser(userId: string): Promise<Holding[]> {
    return this.holdingModel.find({ userId }).exec();
  }

  async getUsersHoldingAsset(asset: string): Promise<string[]> {
    const holdings = await this.holdingModel.find({ asset }).select('userId').exec();
    return [...new Set(holdings.map(h => h.userId))];
  }

  async deleteHolding(userId: string, asset: string): Promise<void> {
    await this.holdingModel.deleteOne({ userId, asset }).exec();
  }
}
