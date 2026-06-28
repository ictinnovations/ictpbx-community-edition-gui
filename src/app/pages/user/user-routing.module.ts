import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserComponent } from './user.component';
import { FormsUserComponent } from './user-component';
import { AddUserComponent } from './user-form-component';
import { UserResourceComponent } from './user-resource-form-component';

import { UserImportDataComponent } from './user-component-import-data';
const routes: Routes = [{
  path: '',
  component: UserComponent,
  children: [{
    path: 'user',
    component: FormsUserComponent,
  }, {
    path: 'user/new',
    component: AddUserComponent,
  }, {
    path: 'user/:id',
    component: AddUserComponent,
  }, {
    path: 'user/csv/import/data',
    component: UserImportDataComponent,
  }, {
    path: 'user/:id/resource',
    component: UserResourceComponent,
  }, {
    path: 'user/:id/delete',
    component: AddUserComponent,
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
export class UserRoutingModule {

}

export const routedComponents = [
  UserComponent,
  FormsUserComponent,
  AddUserComponent,
  UserResourceComponent,
  UserImportDataComponent
];
