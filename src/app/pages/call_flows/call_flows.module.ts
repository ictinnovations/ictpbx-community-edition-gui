import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeModule } from '../../@theme/theme.module';
import { CallFlowsRoutingModule, routedComponents } from './call_flows-routing.module';
import { CallFlowService } from './call_flow.service';
import {
  NbCardModule, NbIconModule, NbButtonModule, NbInputModule,
  NbSelectModule, NbCheckboxModule, NbWindowModule, NbAlertModule, NbTabsetModule,
} from '@nebular/theme';

@NgModule({
  imports: [
    CommonModule, FormsModule, ThemeModule, CallFlowsRoutingModule,
    NbCardModule, NbIconModule, NbButtonModule, NbInputModule,
    NbSelectModule, NbCheckboxModule, NbWindowModule.forChild(), NbAlertModule, NbTabsetModule,
  ],
  declarations: [...routedComponents],
  providers: [CallFlowService],
})
export class CallFlowsModule {}
