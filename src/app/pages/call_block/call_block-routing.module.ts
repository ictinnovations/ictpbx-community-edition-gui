import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CallBlockComponent } from './call_block.component';
import { CallBlockListComponent } from './call_block-list.component';
import { CallBlockFormComponent } from './call_block-form.component';

const routes: Routes = [{
  path: '',
  component: CallBlockComponent,
  children: [
    { path: 'call_block',       component: CallBlockListComponent },
    { path: 'call_block/new',   component: CallBlockFormComponent },
    { path: 'call_block/:id',   component: CallBlockFormComponent },
  ],
}];

export const routedComponents = [CallBlockComponent, CallBlockListComponent, CallBlockFormComponent];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CallBlockRoutingModule {}
