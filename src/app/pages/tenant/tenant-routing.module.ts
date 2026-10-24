import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TenantComponent } from './tenant.component';
import { FormsTenantComponent } from './tenant-component';
import { AddTenantComponent } from './tenant-form-component';
import { TenantReportComponent } from './tenant_report-component';
import { TenantImportDataComponent } from './tenant-component-import-data';


const routes: Routes = [{
  path: '',
  component: TenantComponent,
  children: [{
    path: 'tenant',
    component: FormsTenantComponent,
  },
  {
    path: 'tenant/import/csv/data',
    component: TenantImportDataComponent,
  },
  {
    path: 'tenant_report/:id',
    component: TenantReportComponent
  },

  {
    path: 'tenant/new',
    component: AddTenantComponent,
  }, {
    path: 'tenant/:id',
    component: AddTenantComponent,
  }, {
    path: 'tenant/:id/delete',
    component: AddTenantComponent,
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
export class TenantRoutingModule {

}

export const routedComponents = [
  TenantComponent,
  FormsTenantComponent,
  AddTenantComponent,
  TenantImportDataComponent,
  TenantReportComponent
];
