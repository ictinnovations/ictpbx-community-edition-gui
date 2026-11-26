import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeModule } from '../../@theme/theme.module';
import { MusicOnHoldRoutingModule, routedComponents } from './music_on_hold-routing.module';
import { MusicOnHoldService } from './music_on_hold.service';
import { NbCardModule, NbIconModule, NbButtonModule, NbInputModule, NbSelectModule, NbWindowModule } from '@nebular/theme';

@NgModule({
  imports: [CommonModule, FormsModule, ThemeModule, MusicOnHoldRoutingModule,
            NbCardModule, NbIconModule, NbButtonModule, NbInputModule, NbSelectModule,
            NbWindowModule.forChild()],
  declarations: [...routedComponents],
  providers: [MusicOnHoldService],
})
export class MusicOnHoldModule {}
