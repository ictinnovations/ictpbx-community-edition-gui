import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';



import { ThemeModule } from '../../@theme/theme.module';
import { MatTableModule } from '@angular/material/table';
import { CdkTableModule } from '@angular/cdk/table';
import { MatSortModule  } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FileUploadModule } from 'ng2-file-upload';
import { NbCardModule, NbIconModule } from '@nebular/theme';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Ng2CompleterModule } from 'ng2-completer';
import { Announcement } from './announcement';
import { AnnouncementComponent } from './announcement.component';


@NgModule({
  
  imports: [
    CommonModule,
    ThemeModule,
    MatTableModule,
    CdkTableModule,
    MatSortModule,
    FileUploadModule,
    FormsModule,
    MatButtonModule,
    MatPaginatorModule,
    MatIconModule,
    NbCardModule,
    FormsModule,
    ReactiveFormsModule,
    NbIconModule,
    TranslateModule,
    Ng2CompleterModule
  ],
  declarations: [
    AnnouncementComponent
  ]
})
export class AnnouncementModule { }
