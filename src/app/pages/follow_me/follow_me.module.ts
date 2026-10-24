import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeModule } from '../../@theme/theme.module';
import { FollowMeRoutingModule, routedComponents } from './follow_me-routing.module';
import { FollowMeService } from './follow_me.service';
import {
  NbCardModule, NbIconModule, NbButtonModule, NbInputModule,
  NbSelectModule, NbCheckboxModule, NbWindowModule, NbAlertModule, NbTabsetModule,
} from '@nebular/theme';

@NgModule({
  imports: [
    CommonModule, FormsModule, ThemeModule, FollowMeRoutingModule,
    NbCardModule, NbIconModule, NbButtonModule, NbInputModule,
    NbSelectModule, NbCheckboxModule, NbWindowModule.forChild(), NbAlertModule, NbTabsetModule,
  ],
  declarations: [...routedComponents],
  providers: [FollowMeService],
})
export class FollowMeModule {}
