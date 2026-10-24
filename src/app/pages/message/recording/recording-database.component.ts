import { Recording } from './recording';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class RecordingDatabase {
  dataChange: BehaviorSubject<Recording[]> = new BehaviorSubject<Recording[]>([]);
  get data(): Recording[] { return this.dataChange.value; }

  constructor(private aRecording: Recording[]) {
    this.dataChange.next(aRecording.slice());
  }
}
