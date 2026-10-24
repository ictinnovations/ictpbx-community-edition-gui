import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Voicemail } from './voicemails';

export class VoicemailDatabase {
  dataChange: BehaviorSubject<Voicemail[]> = new BehaviorSubject<Voicemail[]>([]);
  get data(): Voicemail[] { return this.dataChange.value; }

  constructor(data: Voicemail[]) {
    this.dataChange.next(data);
  }
}
