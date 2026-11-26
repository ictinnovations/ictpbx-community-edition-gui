import { Rate } from './rate';
import { BehaviorSubject} from 'rxjs/BehaviorSubject';

export class RateDatabase {
  dataChange: BehaviorSubject<Rate[]> = new BehaviorSubject<Rate[]>([]);
  get data(): Rate[] {
    return this.dataChange.value;
  }
  constructor(private aRate: Rate[]) {
    const rateData = aRate.slice();
    this.dataChange.next(rateData);
  }
}
