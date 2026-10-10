import { Plan } from './plan';
import { BehaviorSubject} from 'rxjs/BehaviorSubject';

export class PlanDatabase {
  dataChange: BehaviorSubject<Plan[]> = new BehaviorSubject<Plan[]>([]);
  get data(): Plan[] {
    return this.dataChange.value;
  }
  constructor(private aPlan: Plan[]) {
    const planData = aPlan.slice();
    this.dataChange.next(planData);
  }
}
