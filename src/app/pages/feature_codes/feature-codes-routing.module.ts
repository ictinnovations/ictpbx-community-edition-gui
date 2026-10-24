import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeatureCodesComponent } from './feature-codes.component';

const routes: Routes = [
  { path: '', component: FeatureCodesComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeatureCodesRoutingModule {}
