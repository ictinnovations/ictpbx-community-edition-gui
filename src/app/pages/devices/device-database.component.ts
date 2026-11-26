import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Device } from './device';

export class DeviceDatabase {
  dataChange: BehaviorSubject<Device[]> = new BehaviorSubject<Device[]>([]);
  get data(): Device[] { return this.dataChange.value; }

  constructor(data: Device[]) {
    this.dataChange.next(data);
  }
}
