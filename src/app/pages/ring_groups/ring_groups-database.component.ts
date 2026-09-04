import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { RingGroup } from './ring_groups';

export class RingGroupDatabase {
  dataChange: BehaviorSubject<RingGroup[]> = new BehaviorSubject<RingGroup[]>([]);
  get data(): RingGroup[] { return this.dataChange.value; }

  constructor(data: RingGroup[]) {
    this.dataChange.next(data);
  }
}
