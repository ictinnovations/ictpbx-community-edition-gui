import { NgModule } from '@angular/core';

import { ThemeModule } from '../../@theme/theme.module';
import { IncomingNumberRoutingModule, routedComponents } from './incoming_number-routing.module';
import { FormsIncomingNumberComponent } from './incoming_number-component';
import { MatTableModule } from '@angular/material/table';
import { CdkTableModule } from '@angular/cdk/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { IncomingNumberService } from './incoming_number.service';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { NbCardModule } from '@nebular/theme';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RingGroupService } from '../ring_groups/ring_groups.service';
import { IvrMenuService } from '../ivr_menus/ivr_menu.service';
import { VoicemailService } from '../voicemails/voicemails.service';
import { InboundRouteService } from '../inbound_routes/inbound_route.service';


@NgModule({
  imports: [
    ThemeModule,
    IncomingNumberRoutingModule,
    MatTableModule,
    CdkTableModule,
    MatSortModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatPaginatorModule,
    NbCardModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  declarations: [
    ...routedComponents,
  ],
  providers: [
    RingGroupService,
    IvrMenuService,
    VoicemailService,
    InboundRouteService,
  ],
})
export class IncomingNumberModule { }
