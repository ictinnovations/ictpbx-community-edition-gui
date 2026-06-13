import { coverpage } from './coverpage';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class CoverpageDatabase {
  dataChange: BehaviorSubject<coverpage[]> = new BehaviorSubject<coverpage[]>([]);
  get data(): coverpage[] {
    return this.dataChange.value;
  }
  constructor(aCoverpage: coverpage[]) {
    const coverData = aCoverpage.slice();
    this.dataChange.next(coverData);
  }
}
