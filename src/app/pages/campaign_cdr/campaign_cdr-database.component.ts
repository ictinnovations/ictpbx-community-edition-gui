import { CampaignCDR } from './campaign_cdr';
import { BehaviorSubject} from 'rxjs/BehaviorSubject';

export class CampaignCDRDatabase {
  dataChange: BehaviorSubject<CampaignCDR[]> = new BehaviorSubject<CampaignCDR[]>([]);
  get data(): CampaignCDR[] {
    return this.dataChange.value;
  }
  constructor(private aCDR: CampaignCDR[]) {
    const cdrData = aCDR.slice();
    this.dataChange.next(cdrData);
  }
}
