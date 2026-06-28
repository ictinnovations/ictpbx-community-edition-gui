import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Payment } from './payment';
import { PaymentService } from './payment.service';
import { AppService } from '../../app.service';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'ngx-add-payment-component',
  templateUrl: './payment-form-component.html',
  styleUrls: ['./payment-form-component.scss'],
})

export class AddPaymentComponent implements OnInit {

  constructor(private http: Http, private route: ActivatedRoute, private payment_service: PaymentService,
  private router: Router, private app_service: AppService) { }

  form1: any = {};
  payment: Payment = new Payment;
  payment_id: any = null;
  tenants: any[] = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.payment_id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        return null;
      } else {
        return this.payment_service.get_PaymentData(this.payment_id).then(data => {
          this.payment = data;
        });
      }
    });
    this.app_service.loadTenants().then(data => this.tenants = data);
  }

  addPayment(): void {
    this.payment_service.add_Payment(this.payment).then(response => {
      // Refresh the header balance from the tenant's updated credit
      const tid = this.payment.tenant_id;
      if (tid) {
        this.app_service.loadTenants().then((tenants: any[]) => {
          const t = tenants.find(x => x.tenant_id == tid);
          if (t && t.credit != null) localStorage.setItem('credit', String(t.credit));
        }).catch(() => {});
      }
      this.router.navigate(['../../payment'], {relativeTo: this.route});
    });
  }

  updatePayment(): void {
    this.payment_service.update_Payment(this.payment).then(() => {
      this.router.navigate(['../../payment'], {relativeTo: this.route});
    })
    .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
