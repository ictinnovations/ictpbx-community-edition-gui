import { NgModule } from '@angular/core';

import { ThemeModule } from '../../@theme/theme.module';
import { TenantRoutingModule, routedComponents } from './tenant-routing.module';
import { MatTableModule } from '@angular/material/table';
import { CdkTableModule } from '@angular/cdk/table';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { NbButtonModule, NbCardModule, NbIconModule } from '@nebular/theme';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FileUploadModule } from 'ng2-file-upload';
// import { TenantComponent } from './tenant-component';
import { TranslateModule } from '@ngx-translate/core';
import { StatusComponent } from './status-card/status-card.component';


@NgModule({
  imports: [
    ThemeModule,
    TenantRoutingModule,
    MatTableModule,
    CdkTableModule,
    MatSortModule,
    MatButtonModule,
    MatPaginatorModule,
    NbCardModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    NbIconModule,
    NbButtonModule,
    FileUploadModule,
    TranslateModule
  ],
  declarations: [
    ...routedComponents,
    StatusComponent
  ],
})
export class TenantModule { }