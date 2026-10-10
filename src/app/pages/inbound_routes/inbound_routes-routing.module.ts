import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InboundRoutesComponent } from './inbound_routes.component';
import { InboundRouteListComponent } from './inbound_route-list.component';
import { InboundRouteFormComponent } from './inbound_route-form.component';

const routes: Routes = [{
  path: '',
  component: InboundRoutesComponent,
  children: [
    { path: 'inbound_routes',      component: InboundRouteListComponent },
    { path: 'inbound_routes/new',  component: InboundRouteFormComponent },
    { path: 'inbound_routes/:id',  component: InboundRouteFormComponent },
  ],
}];

export const routedComponents = [InboundRoutesComponent, InboundRouteListComponent, InboundRouteFormComponent];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InboundRoutesRoutingModule {}
