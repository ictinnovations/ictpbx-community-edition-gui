import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DidsContainerComponent } from './dids-container.component';
import { DidsComponent } from './dids.component';
import { DidsFormComponent } from './dids-form.component';

const routes: Routes = [{
  path: '',
  component: DidsContainerComponent,
  children: [
    { path: 'dids',      component: DidsComponent },
    { path: 'dids/new',  component: DidsFormComponent },
    { path: 'dids/:id',  component: DidsFormComponent },
  ],
}];

export const routedComponents = [
  DidsContainerComponent,
  DidsComponent,
  DidsFormComponent,
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DidsRoutingModule {}
