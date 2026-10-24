import { Payment } from './payment';
import { BehaviorSubject} from 'rxjs/BehaviorSubject';

export class PaymentDatabase {
  dataChange: BehaviorSubject<Payment[]> = new BehaviorSubject<Payment[]>([]);
  get data(): Payment[] {
    return this.dataChange.value;
  }
  constructor(private aPayment: Payment[]) {
    const paymentData = aPayment.slice();
    this.dataChange.next(paymentData);
  }
}
