import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NbCardModule, NbButtonModule, NbInputModule, NbSelectModule,
  NbSpinnerModule, NbAlertModule, NbBadgeModule, NbIconModule,
} from '@nebular/theme';
import { PackageRoutingModule } from './package-routing.module';
import { PackageComponent } from './package.component';

@NgModule({
  declarations: [PackageComponent],
  imports: [
    CommonModule, FormsModule, PackageRoutingModule,
    NbCardModule, NbButtonModule, NbInputModule, NbSelectModule,
    NbSpinnerModule, NbAlertModule, NbBadgeModule, NbIconModule,
  ],
})
export class PackageModule {}
