import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MfaRoutingModule } from './mfa-routing.module';
import { ClipboardModule } from '@angular/cdk/clipboard';

@NgModule({
  imports: [
    ClipboardModule,
    CommonModule,
    MfaRoutingModule
  ]
})
export class MfaModule { }
