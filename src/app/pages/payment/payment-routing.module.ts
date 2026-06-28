import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PaymentComponent } from './payment.component';
import { FormsPaymentComponent } from './payment-component';
import { AddPaymentComponent } from './payment-form-component';

const routes: Routes = [{
  path: '',
  component: PaymentComponent,
  children: [{
    path: 'payment',
    component: FormsPaymentComponent,
  }, {
    path: 'payment/new',
    component: AddPaymentComponent,
  }, {
    path: 'payment/:id',
    component: AddPaymentComponent,
  }, {
    path: 'payment/:id/delete',
    component: AddPaymentComponent,
  }],
}];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [
    RouterModule,
  ],
})
export class PaymentRoutingModule {

}

export const routedComponents = [
  PaymentComponent,
  FormsPaymentComponent,
  AddPaymentComponent,
];
