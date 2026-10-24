import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeModule } from '../../@theme/theme.module';
import { GatewaysRoutingModule, routedComponents } from './gateways-routing.module';
import { GatewayService } from './gateway.service';
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
    CommonModule, FormsModule, ThemeModule, GatewaysRoutingModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, CdkTableModule, NbCardModule, NbIconModule,
    NbButtonModule, NbInputModule, NbSelectModule, NbCheckboxModule,
    NbWindowModule.forChild(), NbTabsetModule,
  ],
  declarations: [...routedComponents],
  providers: [GatewayService],
})
export class GatewaysModule {}
