import { NgModule } from '@angular/core';

import { ThemeModule } from '../../@theme/theme.module';
import { CampaignCDRComponent } from './campaign_cdr.component';
import { RouterModule } from '@angular/router';
import {  MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CdkTableModule } from '@angular/cdk/table';
import { NbCardModule } from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    ThemeModule,
    RouterModule,
    MatTableModule,
    CdkTableModule,
    MatSortModule,
    MatButtonModule,
    MatPaginatorModule,
    MatRadioModule,
    NbCardModule,
    TranslateModule
  ],
  declarations: [
    CampaignCDRComponent, 
  ],
})
export class CampaignCDRModule { }