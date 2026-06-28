import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CallQueue } from './call_queues';

export class CallQueueDatabase {
  dataChange: BehaviorSubject<CallQueue[]> = new BehaviorSubject<CallQueue[]>([]);
  get data(): CallQueue[] { return this.dataChange.value; }

  constructor(data: CallQueue[]) {
    this.dataChange.next(data);
  }
}
