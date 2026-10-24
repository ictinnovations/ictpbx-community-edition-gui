import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { FeatureCodesRoutingModule } from './feature-codes-routing.module';
import { FeatureCodesComponent } from './feature-codes.component';
import { NbCardModule, NbButtonModule, NbInputModule, NbIconModule } from '@nebular/theme';

@NgModule({
  imports: [CommonModule, FormsModule, HttpModule, FeatureCodesRoutingModule,
            NbCardModule, NbButtonModule, NbInputModule, NbIconModule],
  declarations: [FeatureCodesComponent],
})
export class FeatureCodesModule {}
