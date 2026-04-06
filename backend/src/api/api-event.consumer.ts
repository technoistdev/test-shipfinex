import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller()
export class ApiEventConsumer {
  constructor(private eventEmitter: EventEmitter2) {}

  @EventPattern('nav.calculated')
  handleNavCalculated(@Payload() data: any) {
    this.eventEmitter.emit(`nav.${data.userId}`, data);
  }

  @EventPattern('alert.triggered')
  handleAlertTriggered(@Payload() data: any) {
    this.eventEmitter.emit(`alert.${data.userId}`, data);
  }

  @EventPattern('blockchain.alert')
  handleBlockchainAlert(@Payload() data: any) {
    this.eventEmitter.emit('blockchain.intel', data);
  }
}
