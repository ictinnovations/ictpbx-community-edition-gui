import { CDR } from './cdr';
import { BehaviorSubject} from 'rxjs/BehaviorSubject';

export class CDRDatabase {
  dataChange: BehaviorSubject<CDR[]> = new BehaviorSubject<CDR[]>([]);
  get data(): CDR[] {
    return this.dataChange.value;
  }
  constructor(private aCDR: CDR[]) {
    const cdrData = aCDR.slice();
    this.dataChange.next(cdrData);
  }
}
