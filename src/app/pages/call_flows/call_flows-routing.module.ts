import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CallFlowsComponent } from './call_flows.component';
import { CallFlowsListComponent } from './call_flows-list.component';
import { CallFlowsFormComponent } from './call_flows-form.component';

const routes: Routes = [{
  path: '',
  component: CallFlowsComponent,
  children: [
    { path: 'call_flows',       component: CallFlowsListComponent },
    { path: 'call_flows/new',   component: CallFlowsFormComponent },
    { path: 'call_flows/:id',   component: CallFlowsFormComponent },
  ],
}];

export const routedComponents = [CallFlowsComponent, CallFlowsListComponent, CallFlowsFormComponent];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CallFlowsRoutingModule {}
