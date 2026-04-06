import { Controller, Get, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NavSnapshot } from '../../nav-engine/schemas/nav-snapshot.schema';

@Controller('nav')
export class NavController {
  constructor(
    @InjectModel(NavSnapshot.name) private navSnapshotModel: Model<NavSnapshot>,
  ) {}

  @Get('history')
  async getNavHistory(@Query('userId') userId: string) {
    if (!userId) return [];
    return this.navSnapshotModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }
}
