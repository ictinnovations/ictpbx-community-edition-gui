import { NgModule } from '@angular/core';

import { ThemeModule } from '../../@theme/theme.module';
import { InFaxComponent } from './infax-component';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { CdkTableModule } from '@angular/cdk/table';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { NbCardModule, NbIconModule, NbSelectModule } from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { Ng2CompleterModule } from 'ng2-completer';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    ThemeModule,
    RouterModule,
    MatTableModule,
    CdkTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    NbCardModule,
    NbIconModule,
    NbSelectModule,
    MatIconModule,
    TranslateModule,
    PdfViewerModule,
    Ng2CompleterModule,
    Ng2CompleterModule,
    Ng2CompleterModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [
    InFaxComponent,
  ],
})
export class InFaxModule { }