import { Tenant } from './tenant';
import { BehaviorSubject} from 'rxjs/BehaviorSubject';

export class TenantDatabase {
  dataChange: BehaviorSubject<Tenant[]> = new BehaviorSubject<Tenant[]>([]);
  get data(): Tenant[] {
    return this.dataChange.value;
  }
  constructor(private aTenant: Tenant[]) {
    const tenantData = aTenant.slice();
    this.dataChange.next(tenantData);
  }
}
