import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RealtimeRoutingModule } from './realtime-routing.module';
import { RealtimeComponent } from './realtime.component';
import { NbCardModule, NbIconModule, NbButtonModule, NbInputModule } from '@nebular/theme';

@NgModule({
  imports: [CommonModule, FormsModule, HttpModule, RealtimeRoutingModule, NbCardModule, NbIconModule, NbButtonModule, NbInputModule],
  declarations: [RealtimeComponent],
})
export class RealtimeModule {}
