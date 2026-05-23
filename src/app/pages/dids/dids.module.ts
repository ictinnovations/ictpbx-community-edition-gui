import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ThemeModule } from '../../@theme/theme.module';
import { DidsRoutingModule, routedComponents } from './dids-routing.module';
import { DidsService } from './dids.service';

import {
  NbCardModule,
  NbButtonModule,
  NbInputModule,
  NbSelectModule,
  NbIconModule,
} from '@nebular/theme';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ThemeModule,
    DidsRoutingModule,
    NbCardModule,
    NbButtonModule,
    NbInputModule,
    NbSelectModule,
    NbIconModule,
  ],
  declarations: [...routedComponents],
  providers: [DidsService],
})
export class DidsModule {}
