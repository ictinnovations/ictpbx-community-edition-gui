import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RingGroupsComponent } from './ring_groups.component';
import { FormsRingGroupsComponent } from './ring_groups-component';
import { AddRingGroupComponent } from './ring_groups-form-component';

const routes: Routes = [{
  path: '',
  component: RingGroupsComponent,
  children: [
    { path: 'ring_groups',      component: FormsRingGroupsComponent },
    { path: 'ring_groups/new',  component: AddRingGroupComponent },
    { path: 'ring_groups/:id',  component: AddRingGroupComponent },
  ],
}];

export const routedComponents = [
  RingGroupsComponent,
  FormsRingGroupsComponent,
  AddRingGroupComponent,
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RingGroupsRoutingModule {}
