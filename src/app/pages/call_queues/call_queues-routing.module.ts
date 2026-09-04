import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CallQueuesComponent } from './call_queues.component';
import { FormsCallQueuesComponent } from './call_queues-component';
import { AddCallQueueComponent } from './call_queues-form-component';

const routes: Routes = [{
  path: '',
  component: CallQueuesComponent,
  children: [
    { path: 'call_queues',       component: FormsCallQueuesComponent },
    { path: 'call_queues/new',   component: AddCallQueueComponent },
    { path: 'call_queues/:id',   component: AddCallQueueComponent },
  ],
}];

export const routedComponents = [
  CallQueuesComponent,
  FormsCallQueuesComponent,
  AddCallQueueComponent,
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CallQueuesRoutingModule {}
