import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IvrMenusComponent } from './ivr_menus.component';
import { IvrMenuListComponent } from './ivr_menu-list.component';
import { IvrMenuFormComponent } from './ivr_menu-form.component';

const routes: Routes = [{
  path: '',
  component: IvrMenusComponent,
  children: [
    { path: 'ivr_menus',      component: IvrMenuListComponent },
    { path: 'ivr_menus/new',  component: IvrMenuFormComponent },
    { path: 'ivr_menus/:id',  component: IvrMenuFormComponent },
  ],
}];

export const routedComponents = [IvrMenusComponent, IvrMenuListComponent, IvrMenuFormComponent];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IvrMenusRoutingModule {}
