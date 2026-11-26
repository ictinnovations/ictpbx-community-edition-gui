import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeModule } from '../../@theme/theme.module';
import { CallBlockRoutingModule, routedComponents } from './call_block-routing.module';
import { CallBlockService } from './call_block.service';
import {
  NbCardModule, NbIconModule, NbButtonModule, NbInputModule,
  NbSelectModule, NbCheckboxModule, NbWindowModule, NbAlertModule,
} from '@nebular/theme';

@NgModule({
  imports: [
    CommonModule, FormsModule, ThemeModule, CallBlockRoutingModule,
    NbCardModule, NbIconModule, NbButtonModule, NbInputModule,
    NbSelectModule, NbCheckboxModule, NbWindowModule.forChild(), NbAlertModule,
  ],
  declarations: [...routedComponents],
  providers: [CallBlockService],
})
export class CallBlockModule {}
