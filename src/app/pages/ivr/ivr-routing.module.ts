import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FormsIvrComponent } from './ivr-component';
import { AddIvrComponent } from './ivr-form-component';

const routes: Routes = [
  { path: 'ivr', component: FormsIvrComponent },
  { path: 'ivr/new', component: AddIvrComponent },
  { path: 'ivr/:id', component: AddIvrComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IvrRoutingModule { }

export const routedComponents = [
  FormsIvrComponent,
  AddIvrComponent,
];
