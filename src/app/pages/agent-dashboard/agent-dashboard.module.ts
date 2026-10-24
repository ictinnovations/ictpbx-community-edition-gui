import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NbActionsModule, NbButtonGroupModule, NbButtonModule, NbCardModule, NbIconModule, NbInputModule, NbSelectModule, NbToastrModule } from '@nebular/theme';
import { AgentDashboardComponent } from './agent-dashboard.component';
import { AgentDashboardService } from './agent-dashboard.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ContactService } from '../contact/contact.service';
import { CampaignService } from '../campaigns/campaign.service';
import { ExtensionService } from '../extension/extension.service';

const routes: Routes = [
  { path: '', component: AgentDashboardComponent },
];

@NgModule({
  declarations: [AgentDashboardComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NbCardModule,
    NbSelectModule,
    NbIconModule,
    NbButtonModule,
    NbInputModule,
    NbButtonGroupModule,
    NbActionsModule,
    NbToastrModule.forRoot(),
    TranslateModule,
    MatTableModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
  ],
  providers: [
    AgentDashboardService,
    ContactService,
    CampaignService,
    ExtensionService,
  ],
})
export class AgentDashboardModule { }
