import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ThemeModule } from '../../@theme/theme.module';
import { ConferencesRoutingModule, routedComponents } from './conferences-routing.module';
import { ConferenceCenterService } from './conferences.service';
import { NbCardModule, NbIconModule, NbButtonModule, NbInputModule, NbCheckboxModule, NbSelectModule, NbWindowModule, NbTooltipModule } from '@nebular/theme';

@NgModule({
  imports: [CommonModule, FormsModule, HttpModule, ThemeModule, ConferencesRoutingModule,
            NbCardModule, NbIconModule, NbButtonModule, NbInputModule, NbCheckboxModule, NbSelectModule,
            NbWindowModule.forChild(), NbTooltipModule],
  declarations: [...routedComponents],
  providers: [ConferenceCenterService],
})
export class ConferencesModule {}
