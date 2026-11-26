import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  NbCardModule, NbButtonModule, NbAlertModule, NbSpinnerModule,
  NbSelectModule, NbProgressBarModule, NbBadgeModule,
} from '@nebular/theme';
import { BillingQuotaRoutingModule } from './billing-quota-routing.module';
import { BillingQuotaComponent } from './billing-quota.component';

@NgModule({
  declarations: [BillingQuotaComponent],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NbCardModule,
    NbButtonModule,
    NbAlertModule,
    NbSpinnerModule,
    NbSelectModule,
    NbProgressBarModule,
    NbBadgeModule,
    BillingQuotaRoutingModule,
  ],
})
export class BillingQuotaModule {}
