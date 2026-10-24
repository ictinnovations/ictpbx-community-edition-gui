import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  NbCardModule, NbButtonModule, NbAlertModule, NbInputModule,
  NbIconModule,
} from '@nebular/theme';
import { ApiKeysRoutingModule } from './api-keys-routing.module';
import { ApiKeysComponent } from './api-keys.component';

@NgModule({
  declarations: [ApiKeysComponent],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NbCardModule,
    NbButtonModule,
    NbAlertModule,
    NbInputModule,
    NbIconModule,
    ApiKeysRoutingModule,
  ],
})
export class ApiKeysModule {}
