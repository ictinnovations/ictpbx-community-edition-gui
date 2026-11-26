import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FollowMeComponent } from './follow_me.component';
import { FollowMeListComponent } from './follow_me-list.component';
import { FollowMeFormComponent } from './follow_me-form.component';

const routes: Routes = [{
  path: '',
  component: FollowMeComponent,
  children: [
    { path: 'follow_me',       component: FollowMeListComponent },
    { path: 'follow_me/new',   component: FollowMeFormComponent },
    { path: 'follow_me/:id',   component: FollowMeFormComponent },
  ],
}];

export const routedComponents = [FollowMeComponent, FollowMeListComponent, FollowMeFormComponent];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FollowMeRoutingModule {}
