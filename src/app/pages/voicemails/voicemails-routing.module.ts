import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VoicemailsComponent } from './voicemails.component';
import { FormsVoicemailsComponent } from './voicemails-component';
import { AddVoicemailComponent } from './voicemails-form-component';

const routes: Routes = [{
  path: '',
  component: VoicemailsComponent,
  children: [
    { path: 'voicemails',      component: FormsVoicemailsComponent },
    { path: 'voicemails/new',  component: AddVoicemailComponent },
    { path: 'voicemails/:id',  component: AddVoicemailComponent },
  ],
}];

export const routedComponents = [
  VoicemailsComponent,
  FormsVoicemailsComponent,
  AddVoicemailComponent,
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VoicemailsRoutingModule {}
