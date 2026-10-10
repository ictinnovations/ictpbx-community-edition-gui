import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeModule } from '../../@theme/theme.module';
import { IvrMenusRoutingModule, routedComponents } from './ivr_menus-routing.module';
import { IvrMenuService } from './ivr_menu.service';
import { RecordingPickerModule } from '../../components/recording-picker/recording-picker.module';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CdkTableModule } from '@angular/cdk/table';
import {
  NbCardModule, NbIconModule, NbButtonModule, NbInputModule,
  NbSelectModule, NbCheckboxModule, NbWindowModule, NbTabsetModule,
} from '@nebular/theme';

@NgModule({
  imports: [
    CommonModule, FormsModule, ThemeModule, IvrMenusRoutingModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, CdkTableModule, NbCardModule, NbIconModule,
    NbButtonModule, NbInputModule, NbSelectModule, NbCheckboxModule,
    NbWindowModule.forChild(), NbTabsetModule, RecordingPickerModule,
  ],
  declarations: [...routedComponents],
  providers: [IvrMenuService],
})
export class IvrMenusModule {}
