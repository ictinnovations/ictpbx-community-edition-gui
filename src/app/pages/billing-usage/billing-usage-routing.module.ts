import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillingUsageComponent } from './billing-usage.component';

const routes: Routes = [
  { path: '', component: BillingUsageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BillingUsageRoutingModule {}
