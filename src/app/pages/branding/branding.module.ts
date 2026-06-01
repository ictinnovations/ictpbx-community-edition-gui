import { NgModule } from '@angular/core';

import { ThemeModule } from '../../@theme/theme.module';
import { MatTableModule } from '@angular/material/table';
import { CdkTableModule } from '@angular/cdk/table';
import { MatSortModule} from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { NbAlertModule, NbButtonModule, NbCardModule, NbIconModule } from '@nebular/theme';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FileUploadModule } from 'ng2-file-upload';
import { BrandingComponent } from './branding-component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    ThemeModule,
    MatTableModule,
    CdkTableModule,
    MatSortModule,
    MatButtonModule,
    MatPaginatorModule,
    NbCardModule,
    NbAlertModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    NbIconModule,
    NbButtonModule,
    FileUploadModule,
    TranslateModule
  ],
  declarations: [
    BrandingComponent
  ],
})
export class BrandingModule { }
