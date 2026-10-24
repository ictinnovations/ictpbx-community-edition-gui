import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TimeConditionsComponent } from './time_conditions.component';
import { TimeConditionsListComponent } from './time_conditions-list.component';
import { TimeConditionsFormComponent } from './time_conditions-form.component';

const routes: Routes = [{
  path: '',
  component: TimeConditionsComponent,
  children: [
    { path: 'time_conditions',       component: TimeConditionsListComponent },
    { path: 'time_conditions/new',   component: TimeConditionsFormComponent },
    { path: 'time_conditions/:id',   component: TimeConditionsFormComponent },
    { path: '', redirectTo: 'time_conditions', pathMatch: 'full' },
  ],
}];

export const routedComponents = [
  TimeConditionsComponent, TimeConditionsListComponent, TimeConditionsFormComponent,
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TimeConditionsRoutingModule {}
