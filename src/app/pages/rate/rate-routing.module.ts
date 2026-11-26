import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RateComponent } from './rate.component';
import { FormsRateComponent } from './rate-component';
import { AddRateComponent } from './rate-form-component';
import { ImportRateComponent } from './import-rate-component';

const routes: Routes = [{
  path: '',
  component: RateComponent,
  children: [{
    path: 'rate',
    component: FormsRateComponent,
  }, {
    path: 'rate/new',
    component: AddRateComponent,
  },  {
    path: 'rate/import',
    component: ImportRateComponent,
  }, {
    path: 'rate/:id',
    component: AddRateComponent,
  }, {
    path: 'rate/:id/delete',
    component: AddRateComponent,
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
export class RateRoutingModule {

}

export const routedComponents = [
  RateComponent,
  FormsRateComponent,
  AddRateComponent,
  ImportRateComponent
];
