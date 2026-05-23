/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CoreModule } from './@core/core.module';
import { ThemeModule } from './@theme/theme.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import {
  NbChatModule,
  NbDatepickerModule,
  NbDialogModule,
  NbMenuModule,
  NbSidebarModule,
  NbToastrModule,
  NbWindowModule,
} from '@nebular/theme';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { HttpModule } from '@angular/http';
import { ModalComponent } from './modal.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { AuthModule } from './auth/auth.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { BrandingService } from './pages/branding/branding.service';
// Social Media Login 
//  import { SocialLoginModule, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
//  import { GoogleLoginProvider, FacebookLoginProvider } from '@abacritt/angularx-social-login';
// End Social Media Login

/* Changes start here. */
// Import MSAL and MSAL browser libraries. 
import { MsalGuard, MsalInterceptor, MsalModule, MsalRedirectComponent } from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';

// Import the Azure AD B2C configuration 
import { msalConfig, protectedResources } from '../app/auth/signin/auth-config';

// Import the Angular HTTP interceptor. 
import { HTTP_INTERCEPTORS } from '@angular/common/http';

// Add the essential Angular materials.
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
// import { Password_Policy } from './pages/user/passwd_policy';
import { Password_PolicyComponent } from './pages/password_policy/password_policy-component';
import { PasswordPolicy_Service } from './pages/password_policy/password_policy.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
/* Changes end here. */
// AoT requires an exported function for factories


// AoT requires an exported function for factories
export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient);
}

@NgModule({
  declarations: [AppComponent, ModalComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    HttpModule,
    NgbModule,
    NbEvaIconsModule,
    AuthModule,

    //  SocialLoginModule,
    MatButtonModule,
    MatToolbarModule,
    MatListModule,
    MatTableModule,

    HttpClientModule,
    ThemeModule.forRoot(),

    NbSidebarModule.forRoot(),
    NbMenuModule.forRoot(),
    NbDatepickerModule.forRoot(),
    NbDialogModule.forRoot(),
    NbWindowModule.forRoot(),
    NbToastrModule.forRoot(),
    NbChatModule.forRoot({
      messageGoogleMapKey: 'AIzaSyA_wNuCzia92MAmdLRzmqitRGvCF7wCZPY',
    }),

    // Initiate the MSAL library with the MSAL configuration object
    MsalModule.forRoot(new PublicClientApplication(msalConfig),
      {
        // The routing guard configuration. 
        interactionType: InteractionType.Redirect,
        authRequest: {
          scopes: protectedResources.todoListApi.scopes
        }
      },
      {
        // MSAL interceptor configuration.
        // The protected resource mapping maps your web API with the corresponding app scopes. If your code needs to call another web API, add the URI mapping here.
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map([
          [protectedResources.todoListApi.endpoint, protectedResources.todoListApi.scopes]
        ])
      }),
    /* Changes end here. */
    CoreModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  bootstrap: [
    AppComponent,
    /* Changes start here. */
    MsalRedirectComponent
    /* Changes end here. */
  ],
  entryComponents: [ModalComponent],
  providers: [
    BrandingService,
    PasswordPolicy_Service,
    // Below code is for Social media logins
    // {
    //   provide: 'SocialAuthServiceConfig',
    //   useValue: {
    //     autoLogin: false,
    //     providers: [
    //       {
    //         id: GoogleLoginProvider.PROVIDER_ID,
    //         provider: new GoogleLoginProvider(
    //           '338363267659-plu9n5pjh3mkc5vnnk0l8hn8n9t8sesc.apps.googleusercontent.com'
    //         )
    //       },
    //       {
    //         id: FacebookLoginProvider.PROVIDER_ID,
    //         provider: new FacebookLoginProvider('804293077241198')
    //       }
    //     ],
    //     onError: (err) => {
    //       console.error(err);
    //     }
    //   } as SocialAuthServiceConfig,
    // },

    /* Changes start here. */
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    MsalGuard
    /* Changes end here. */
  ]
})
export class AppModule { }
