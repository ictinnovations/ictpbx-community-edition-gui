import { Route } from './route';
import { BehaviorSubject} from 'rxjs/BehaviorSubject';

export class RouteDatabase {
  dataChange: BehaviorSubject<Route[]> = new BehaviorSubject<Route[]>([]);
  get data(): Route[] {
    return this.dataChange.value;
  }
  constructor(private aRoute: Route[]) {
    const routeData = aRoute.slice();
    this.dataChange.next(routeData);
  }
}
