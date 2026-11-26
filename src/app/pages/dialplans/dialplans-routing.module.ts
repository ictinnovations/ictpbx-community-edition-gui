import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DialplansComponent } from './dialplans.component';

const routes: Routes = [{ path: '', component: DialplansComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DialplansRoutingModule {}
