import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeModule } from '../../@theme/theme.module';
import { InboundRoutesRoutingModule, routedComponents } from './inbound_routes-routing.module';
import { InboundRouteService } from './inbound_route.service';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CdkTableModule } from '@angular/cdk/table';
import {
  NbCardModule, NbIconModule, NbButtonModule, NbInputModule,
  NbSelectModule, NbCheckboxModule, NbWindowModule,
} from '@nebular/theme';

@NgModule({
  imports: [
    CommonModule, FormsModule, ThemeModule, InboundRoutesRoutingModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, CdkTableModule, NbCardModule, NbIconModule,
    NbButtonModule, NbInputModule, NbSelectModule, NbCheckboxModule,
    NbWindowModule.forChild(),
  ],
  declarations: [...routedComponents],
  providers: [InboundRouteService],
})
export class InboundRoutesModule {}
