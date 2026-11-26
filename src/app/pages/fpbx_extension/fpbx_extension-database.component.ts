import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { FpbxExtension } from './fpbx_extension';

export class FpbxExtensionDatabase {
  dataChange: BehaviorSubject<FpbxExtension[]> = new BehaviorSubject<FpbxExtension[]>([]);
  get data(): FpbxExtension[] { return this.dataChange.value; }

  constructor(data: FpbxExtension[]) {
    this.dataChange.next(data);
  }
}
