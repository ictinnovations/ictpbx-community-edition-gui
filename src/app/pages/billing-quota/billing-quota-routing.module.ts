import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillingQuotaComponent } from './billing-quota.component';

const routes: Routes = [
  { path: '', component: BillingQuotaComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BillingQuotaRoutingModule {}
