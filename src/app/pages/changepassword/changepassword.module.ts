import { NgModule } from '@angular/core';
import { NgxEchartsModule } from 'ngx-echarts';

import { ThemeModule } from '../../@theme/theme.module';
import { ChangePasswordComponent } from './changepassword-component';
import { RouterModule } from '@angular/router';
import { CheckValidator } from './password.check.directive';
import { NbButtonModule, NbCardModule } from '@nebular/theme';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    ThemeModule,
    NgxEchartsModule,
    RouterModule,
    NbCardModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    NbButtonModule
  ],
  declarations: [
    CheckValidator,
    ChangePasswordComponent,
  ],
})
export class ChangePasswordModule { }
