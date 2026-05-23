import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { FpbxCdrRoutingModule } from './fpbx_cdr-routing.module';
import { FpbxCdrComponent } from './fpbx_cdr.component';
import { NbCardModule, NbButtonModule, NbInputModule, NbSelectModule, NbIconModule } from '@nebular/theme';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    FpbxCdrRoutingModule,
    NbCardModule,
    NbButtonModule,
    NbInputModule,
    NbSelectModule,
    NbIconModule,
  ],
  declarations: [FpbxCdrComponent],
})
export class FpbxCdrModule {}
