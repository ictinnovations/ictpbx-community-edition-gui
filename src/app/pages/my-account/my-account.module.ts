import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NbCardModule,
  NbButtonModule,
  NbInputModule,
  NbIconModule,
  NbAlertModule,
  NbSpinnerModule,
  NbCheckboxModule,
  NbSelectModule,
} from '@nebular/theme';
import { ThemeModule } from '../../@theme/theme.module';
import { MyAccountRoutingModule } from './my-account-routing.module';
import { MyAccountComponent } from './my-account.component';

@NgModule({
  declarations: [MyAccountComponent],
  imports: [
    CommonModule,
    FormsModule,
    ThemeModule,
    MyAccountRoutingModule,
    NbCardModule,
    NbButtonModule,
    NbInputModule,
    NbIconModule,
    NbAlertModule,
    NbSpinnerModule,
    NbCheckboxModule,
    NbSelectModule,
  ],
})
export class MyAccountModule {}
