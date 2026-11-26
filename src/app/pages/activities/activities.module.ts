import { NgModule } from '@angular/core';

import { ThemeModule } from '../../@theme/theme.module';
import { MatTableModule } from '@angular/material/table';
import { CdkTableModule } from '@angular/cdk/table';
import { MatSortModule} from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { NbButtonModule, NbCardModule, NbIconModule } from '@nebular/theme';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FileUploadModule } from 'ng2-file-upload';
import { ActivitiesComponent } from './activities.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';

@NgModule({
  imports: [
    ThemeModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatFormFieldModule,
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
  declarations : [
    ActivitiesComponent
  ]
})
export class ActivitiesModule { }
