import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialplansRoutingModule } from './dialplans-routing.module';
import { DialplansComponent } from './dialplans.component';
import { NbCardModule } from '@nebular/theme';
import { ThemeModule } from '../../@theme/theme.module';

@NgModule({
  imports: [CommonModule, ThemeModule, DialplansRoutingModule, NbCardModule],
  declarations: [DialplansComponent],
})
export class DialplansModule {}
