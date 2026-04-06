import { Controller, Sse, Query } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NavSnapshot } from '../../nav-engine/schemas/nav-snapshot.schema';

@Controller('stream')
export class StreamController {
  constructor(
    private eventEmitter: EventEmitter2,
    @InjectModel(NavSnapshot.name) private navSnapshotModel: Model<NavSnapshot>
  ) {}

  @Sse()
  streamEvents(@Query('userId') userId: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      if (!userId) {
        subscriber.complete();
        return;
      }

      const navListener = (data: any) => {
        subscriber.next({ data: JSON.stringify({ type: 'nav', payload: data }) } as MessageEvent);
      };

      const alertListener = (data: any) => {
        subscriber.next({ data: JSON.stringify({ type: 'alert', payload: data }) } as MessageEvent);
      };

      const intelListener = (data: any) => {
        subscriber.next({ data: JSON.stringify({ type: 'intel', payload: data }) } as MessageEvent);
      };

      this.eventEmitter.on(`nav.${userId}`, navListener);
      this.eventEmitter.on(`alert.${userId}`, alertListener);
      this.eventEmitter.on('blockchain.intel', intelListener);

      this.navSnapshotModel.findOne({ userId })
        .sort({ createdAt: -1 })
        .exec()
        .then(snapshot => {
          if (snapshot) {
            navListener({
              userId,
              totalNav: snapshot.totalNav,
              timestamp: snapshot.get('createdAt')?.getTime() || Date.now(),
            });
          }
        })
        .catch(err => console.error('Error fetching initial NAV', err));

      return () => {
        this.eventEmitter.off(`nav.${userId}`, navListener);
        this.eventEmitter.off(`alert.${userId}`, alertListener);
        this.eventEmitter.off('blockchain.intel', intelListener);
      };
    });
  }
}
