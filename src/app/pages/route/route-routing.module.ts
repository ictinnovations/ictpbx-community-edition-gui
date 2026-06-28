import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RouteComponent } from './route.component';
import { RoutesComponent } from './route-component';
import { AddRouteComponent } from './route-form-component';
import { ImportRouteComponent } from './import-route-component';

const routes: Routes = [{
  path: '',
  component: RouteComponent,
  children: [{
    path: '',
    component: RoutesComponent,
  }, {
    path: 'new',
    component: AddRouteComponent,
  }, {
    path: 'import',
    component: ImportRouteComponent,
  }, {
    path: ':id/edit',
    component: AddRouteComponent,
  }, {
    path: ':id/delete',
    component: AddRouteComponent,
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
export class RouteRoutingModule {

}

export const routedComponents = [
  RouteComponent,
  RoutesComponent,
  AddRouteComponent,
  ImportRouteComponent
];
