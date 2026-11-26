import { activity } from './activity';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class ActivitiesDatabase {
  dataChange: BehaviorSubject<activity[]> = new BehaviorSubject<activity[]>([]);
  get data(): activity[] {
    return this.dataChange.value;
  }
  constructor(aactivities: activity[]) {
    const coverData = aactivities.slice();
    this.dataChange.next(coverData);
  }
}