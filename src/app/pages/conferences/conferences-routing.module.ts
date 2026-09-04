import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConferencesComponent } from './conferences.component';
import { ConferencesListComponent } from './conferences-list.component';
import { ConferencesFormComponent } from './conferences-form.component';

const routes: Routes = [{
  path: '',
  component: ConferencesComponent,
  children: [
    { path: 'conferences',      component: ConferencesListComponent },
    { path: 'conferences/new',  component: ConferencesFormComponent },
    { path: 'conferences/:id',  component: ConferencesFormComponent },
  ],
}];

export const routedComponents = [ConferencesComponent, ConferencesListComponent, ConferencesFormComponent];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConferencesRoutingModule {}
