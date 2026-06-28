import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  NbCardModule, NbButtonModule, NbAlertModule, NbInputModule,
  NbIconModule, NbBadgeModule, NbSpinnerModule,
} from '@nebular/theme';
import { MessagingRoutingModule } from './messaging-routing.module';
import { MessagingComponent } from './messaging.component';

@NgModule({
  declarations: [MessagingComponent],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NbCardModule,
    NbButtonModule,
    NbAlertModule,
    NbInputModule,
    NbIconModule,
    NbBadgeModule,
    NbSpinnerModule,
    MessagingRoutingModule,
  ],
})
export class MessagingModule {}
