import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { DeviceProfile } from './device-profile';

export class DeviceProfileDatabase {
  dataChange: BehaviorSubject<DeviceProfile[]> = new BehaviorSubject<DeviceProfile[]>([]);
  get data(): DeviceProfile[] { return this.dataChange.value; }

  constructor(data: DeviceProfile[]) {
    this.dataChange.next(data);
  }
}
