import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GatewaysComponent } from './gateways.component';
import { GatewayListComponent } from './gateway-list.component';
import { GatewayFormComponent } from './gateway-form.component';

const routes: Routes = [{
  path: '',
  component: GatewaysComponent,
  children: [
    { path: 'gateways',      component: GatewayListComponent },
    { path: 'gateways/new',  component: GatewayFormComponent },
    { path: 'gateways/:id',  component: GatewayFormComponent },
  ],
}];

export const routedComponents = [GatewaysComponent, GatewayListComponent, GatewayFormComponent];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GatewaysRoutingModule {}
