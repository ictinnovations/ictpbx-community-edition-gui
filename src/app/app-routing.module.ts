import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import {
  NbAuthComponent,
  NbLogoutComponent,
  NbRegisterComponent,
  NbRequestPasswordComponent,
  NbResetPasswordComponent,
} from '@nebular/auth';
import { LoginComponent } from './auth/login/login.component';
import { SigninComponent } from './auth/signin/signin.component';
import { LogoutComponent } from './auth/logout/logout.component';
import { AuthGuard } from './auth-guard.service';
import { MfaComponent } from './auth/mfa/mfa.component';
import { MfaAuthemailComponent } from './auth/mfa/mfa-authemail.component';
import { MfaAuthemessageComponent } from './auth/mfa/mfa-authemessage.component';
import { MfaAuthappComponent } from './auth/mfa/mfa-authapp.component';
import { RequestPasswordComponent } from './auth/request-password/request-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';

const routes: Routes = [
  {
    path: 'pages',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/pages.module')
      .then(m => m.PagesModule),
  },
  {
    path: 'auth',
    component: NbAuthComponent,
    children: [
      {
        path: '',
        component: LoginComponent,
      },
      // {
      //   path: 'signin',
      //   component: SigninComponent,
      // },
      {
        path: 'login',
        component: LoginComponent,
      },

      {
        path: 'register',
        component: NbRegisterComponent,
      },
      {
        path: 'logout',
        component: LogoutComponent,
      },
      {
        path: 'request-password',
        component: RequestPasswordComponent,
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
      },
      {
        path: 'mfa',
        component: MfaComponent,
      },
      {
        path: 'mfa/authemail',
        component: MfaAuthemailComponent
      },
      {
        path: 'mfa/authmessage',
        component: MfaAuthemessageComponent
      },
      {
        path: 'mfa/authapp',
        component: MfaAuthappComponent
      },
    ],
  },
  { path: '', redirectTo: 'pages', pathMatch: 'full' },
  { path: '**', redirectTo: 'pages' },
];

const config: ExtraOptions = {
    useHash: true,
    relativeLinkResolution: 'legacy'
}
@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
