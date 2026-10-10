/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthRoutingModule } from './auth-routing.module';
import { NbAuthModule } from '@nebular/auth';
import { MatIconModule } from '@angular/material/icon'; 
import { NbCardModule, NbAlertModule, NbButtonModule, NbCheckboxModule, NbInputModule, NbIconModule, NbThemeModule, NbLayoutModule } from '@nebular/theme';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { TranslateModule } from '@ngx-translate/core';
import { SigninComponent } from './signin/signin.component';
import { NbTabsetModule } from '@nebular/theme';
import { MfaComponent } from './mfa/mfa.component';
import { MfaAuthappComponent } from './mfa/mfa-authapp.component';
import { MfaAuthemailComponent } from './mfa/mfa-authemail.component';
import { MfaAuthemessageComponent } from './mfa/mfa-authemessage.component';
import { RequestPasswordComponent} from './request-password/request-password.component'
import { ResetPasswordComponent} from './reset-password/reset-password.component'
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NbCardModule,
    NbAlertModule,
    NbInputModule,
    NbButtonModule,
    MatIconModule,
    NbIconModule,
    NbCheckboxModule,
    AuthRoutingModule,
    TranslateModule,
    NbAuthModule,
    NbThemeModule,
    NbLayoutModule,
    NbTabsetModule,
    MatSnackBarModule,
    RouterModule
  ],
  declarations: [
    LoginComponent,
    LogoutComponent,
    SigninComponent,
    MfaComponent,
    MfaAuthappComponent,
    MfaAuthemailComponent,
    MfaAuthemessageComponent,
    RequestPasswordComponent,
    ResetPasswordComponent
  ],
})
export class AuthModule {
}