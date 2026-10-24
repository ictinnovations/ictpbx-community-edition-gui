import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  NbCardModule, NbButtonModule, NbAlertModule, NbSpinnerModule,
  NbSelectModule, NbInputModule, NbProgressBarModule,
} from '@nebular/theme';
import { BillingUsageRoutingModule } from './billing-usage-routing.module';
import { BillingUsageComponent } from './billing-usage.component';

@NgModule({
  declarations: [BillingUsageComponent],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NbCardModule,
    NbButtonModule,
    NbAlertModule,
    NbSpinnerModule,
    NbSelectModule,
    NbInputModule,
    NbProgressBarModule,
    BillingUsageRoutingModule,
  ],
})
export class BillingUsageModule {}
