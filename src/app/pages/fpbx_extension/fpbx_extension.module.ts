import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeModule } from '../../@theme/theme.module';
import { FpbxExtensionRoutingModule, routedComponents } from './fpbx_extension-routing.module';
import { FpbxExtensionService } from './fpbx_extension.service';
import { FollowMeService } from '../follow_me/follow_me.service';

import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CdkTableModule } from '@angular/cdk/table';

import {
  NbCardModule,
  NbIconModule,
  NbButtonModule,
  NbInputModule,
  NbSelectModule,
  NbCheckboxModule,
  NbRadioModule,
  NbWindowModule,
  NbTabsetModule,
} from '@nebular/theme';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ThemeModule,
    FpbxExtensionRoutingModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    CdkTableModule,
    NbCardModule,
    NbIconModule,
    NbButtonModule,
    NbInputModule,
    NbSelectModule,
    NbCheckboxModule,
    NbRadioModule,
    NbWindowModule.forChild(),
    NbTabsetModule,
  ],
  declarations: [...routedComponents],
  providers: [FpbxExtensionService, FollowMeService],
})
export class FpbxExtensionModule {}
