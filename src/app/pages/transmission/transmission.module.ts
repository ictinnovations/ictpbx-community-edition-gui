import { NgModule } from '@angular/core';

import { ThemeModule } from '../../@theme/theme.module';
import { TransmissionRoutingModule, routedComponents } from './transmission-routing.module';
import { FormsTransmissionComponent } from '../../pages/transmission/transmission-component';
import { MatTableModule } from '@angular/material/table';
import { CdkTableModule } from '@angular/cdk/table';
import { TransmissionService } from '../../pages/transmission/transmission.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NbCardModule, NbIconModule } from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    ThemeModule,
    TransmissionRoutingModule,
    MatTableModule,
    MatButtonModule,
    CdkTableModule,
    MatSortModule,
    MatPaginatorModule,
    FormsModule,
    ReactiveFormsModule,
    NbCardModule,
    MatIconModule,
    NbIconModule,
    TranslateModule
  ],
  declarations: [
    ...routedComponents,
  ],
})
export class TransmissionModule { }
