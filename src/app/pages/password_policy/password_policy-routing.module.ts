import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PasswordPolicyComponent } from './password_policy.component';
import { Password_PolicyComponent } from './password_policy-component';

const routes: Routes = [{
  path: '',
  component: PasswordPolicyComponent,
  children: [{
    path: 'password_policy',
    component: Password_PolicyComponent,
  }],
  }]

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [
    RouterModule,
  ],
})
export class Password_PolicyModule {
}

export const routedComponents = [
  PasswordPolicyComponent,
  Password_PolicyComponent
];
