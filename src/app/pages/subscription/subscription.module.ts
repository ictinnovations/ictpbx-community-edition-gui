import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NbCardModule, NbButtonModule, NbSelectModule,
  NbSpinnerModule, NbAlertModule,
} from '@nebular/theme';
import { SubscriptionRoutingModule } from './subscription-routing.module';
import { SubscriptionComponent } from './subscription.component';

@NgModule({
  declarations: [SubscriptionComponent],
  imports: [
    CommonModule, FormsModule, SubscriptionRoutingModule,
    NbCardModule, NbButtonModule, NbSelectModule,
    NbSpinnerModule, NbAlertModule,
  ],
})
export class SubscriptionModule {}
