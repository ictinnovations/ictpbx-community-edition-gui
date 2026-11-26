import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlanComponent } from './plan.component';
import { FormsPlanComponent } from './plan-component';
import { AddPlanComponent } from './plan-form-component';

const routes: Routes = [{
  path: '',
  component: PlanComponent,
  children: [{
    path: 'plan',
    component: FormsPlanComponent,
  }, {
    path: 'plan/new',
    component: AddPlanComponent,
  }, {
    path: 'plan/:id',
    component: AddPlanComponent,
  }, {
    path: 'plan/:id/delete',
    component: AddPlanComponent,
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
export class PlanRoutingModule {

}

export const routedComponents = [
  PlanComponent,
  FormsPlanComponent,
  AddPlanComponent,
];
