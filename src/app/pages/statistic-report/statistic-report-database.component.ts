import { StatisticReport } from './statistic-report';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class StatisticReportDatabase {
    dataChange: BehaviorSubject<StatisticReport[]> = new BehaviorSubject<StatisticReport[]>([]);
    get data(): StatisticReport[] {
        return this.dataChange.value;
    }
    constructor(private aStatR: StatisticReport[]) {
        const statData = aStatR.slice();
        this.dataChange.next(statData);
    }
}