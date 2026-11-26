import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MfaModule } from './mfa.module';
import { MfaComponent } from './mfa.component';
import { MfaAuthemailComponent } from './mfa-authemail.component';
import { MfaAuthemessageComponent } from './mfa-authemessage.component';
import { MfaAuthappComponent } from './mfa-authapp.component';
 
const routes: Routes = [{
  path: 'auth',
  component: MfaComponent,
  children: [],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MfaRoutingModule { }

export const routedComponents = [
  MfaComponent,
  MfaAuthemailComponent,
  MfaAuthemessageComponent,
  MfaAuthappComponent,
];
