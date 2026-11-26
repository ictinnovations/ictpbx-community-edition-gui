import { NgModule } from '@angular/core';
import {  RouterModule } from '@angular/router';
import { ThemeModule } from '../../@theme/theme.module';
import { NbCardModule, NbInputModule } from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';
import { Password_PolicyComponent } from './password_policy-component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PasswordPolicy_Service } from './password_policy.service';

@NgModule({
  imports: [
    ThemeModule,
    RouterModule,
    NbCardModule,
    TranslateModule,
    NbInputModule,
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [
    Password_PolicyComponent 
  ],
  providers:[PasswordPolicy_Service]
})
export class Password_PolicyModule { }
