import { Controller, Get, Post, Delete, Body, Query, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert } from '../../nav-engine/schemas/alert.schema';

@Controller('alerts')
export class AlertsController {
  constructor(
    @InjectModel(Alert.name) private alertModel: Model<Alert>,
  ) {}

  @Post()
  async createAlert(@Body() body: { userId: string; targetNav: number; direction: string }) {
    const alert = new this.alertModel({
      userId: body.userId,
      targetNav: body.targetNav,
      direction: body.direction,
      isTriggered: false
    });
    return alert.save();
  }

  @Get()
  async getAlerts(@Query('userId') userId: string) {
    if (!userId) return [];
    return this.alertModel.find({ userId }).exec();
  }

  @Delete(':id')
  async deleteAlert(@Param('id') id: string) {
    await this.alertModel.findByIdAndDelete(id).exec();
    return { success: true };
  }
}
