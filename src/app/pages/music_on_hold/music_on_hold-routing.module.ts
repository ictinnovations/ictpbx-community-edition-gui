import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MusicOnHoldComponent } from './music_on_hold.component';
import { MusicOnHoldListComponent } from './music_on_hold-list.component';
import { MusicOnHoldFormComponent } from './music_on_hold-form.component';

const routes: Routes = [{
  path: '',
  component: MusicOnHoldComponent,
  children: [
    { path: 'music_on_hold',      component: MusicOnHoldListComponent },
    { path: 'music_on_hold/new',  component: MusicOnHoldFormComponent },
    { path: 'music_on_hold/:id',  component: MusicOnHoldFormComponent },
  ],
}];

export const routedComponents = [MusicOnHoldComponent, MusicOnHoldListComponent, MusicOnHoldFormComponent];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MusicOnHoldRoutingModule {}
