import { Text } from './text';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class TextDatabase {
  dataChange: BehaviorSubject<Text[]> = new BehaviorSubject<Text[]>([]);
  get data(): Text[] { return this.dataChange.value; }

  constructor(private aText: Text[]) {
    this.dataChange.next(aText.slice());
  }
}
