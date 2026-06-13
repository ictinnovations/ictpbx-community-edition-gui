import { Ivr } from './ivr';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class IvrDatabase {
  dataChange: BehaviorSubject<Ivr[]> = new BehaviorSubject<Ivr[]>([]);
  get data(): Ivr[] { return this.dataChange.value; }

  constructor(private aIvr: Ivr[]) {
    this.dataChange.next(aIvr.slice());
  }
}
