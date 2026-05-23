import { Component, OnInit, NgModule, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { Http, HttpModule, Response } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { Payment } from './payment';
import { PaymentService } from './payment.service';
import 'rxjs/add/operator/toPromise';
import { AUserService } from '../user/user.service';
import { User } from '../user/user';

@Component({
  selector: 'ngx-add-payment-component',
  templateUrl: './payment-form-component.html',
  styleUrls: ['./payment-form-component.scss'],
})

export class AddPaymentComponent implements OnInit {

  constructor(private http: Http, private route: ActivatedRoute, private payment_service: PaymentService,
  private router: Router, private user_service: AUserService) { }


  form1: any= {};
  payment: Payment= new Payment;
  payment_id: any= null;

  users: User[] = [];

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
    this.getUserList();
  }

  addPayment(): void {
    this.payment_service.add_Payment(this.payment).then(response => {
      this.router.navigate(['../../payment'], {relativeTo: this.route});
    });
  }

  updatePayment(): void {
    this.payment_service.update_Payment(this.payment).then(() => {
      this.router.navigate(['../../payment'], {relativeTo: this.route});
    })
    .catch(this.handleError);
  }

  getUserList() {
    this.user_service.get_UserList().then(data => {
      this.users = data;
    })
    .catch(err => this.handleError(err));
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
