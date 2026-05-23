import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FpbxExtensionsComponent } from './fpbx_extension.component';
import { FpbxExtensionListComponent } from './fpbx_extension-list.component';
import { FpbxExtensionFormComponent } from './fpbx_extension-form.component';

const routes: Routes = [{
  path: '',
  component: FpbxExtensionsComponent,
  children: [
    { path: 'extensions',      component: FpbxExtensionListComponent },
    { path: 'extensions/new',  component: FpbxExtensionFormComponent },
    { path: 'extensions/:id',  component: FpbxExtensionFormComponent },
  ],
}];

export const routedComponents = [
  FpbxExtensionsComponent,
  FpbxExtensionListComponent,
  FpbxExtensionFormComponent,
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FpbxExtensionRoutingModule {}
