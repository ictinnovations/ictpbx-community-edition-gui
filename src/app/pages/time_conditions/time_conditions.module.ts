import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeModule } from '../../@theme/theme.module';
import { TimeConditionsRoutingModule, routedComponents } from './time_conditions-routing.module';
import { TimeConditionService } from './time_condition.service';
import {
  NbCardModule, NbIconModule, NbButtonModule, NbInputModule,
  NbSelectModule, NbCheckboxModule, NbWindowModule, NbAlertModule,
} from '@nebular/theme';

@NgModule({
  imports: [
    CommonModule, FormsModule, ThemeModule, TimeConditionsRoutingModule,
    NbCardModule, NbIconModule, NbButtonModule, NbInputModule,
    NbSelectModule, NbCheckboxModule, NbWindowModule.forChild(), NbAlertModule,
  ],
  declarations: [...routedComponents],
  providers: [TimeConditionService],
})
export class TimeConditionsModule {}
