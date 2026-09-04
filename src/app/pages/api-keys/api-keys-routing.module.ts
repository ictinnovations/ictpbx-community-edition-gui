import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApiKeysComponent } from './api-keys.component';

const routes: Routes = [
  { path: '', component: ApiKeysComponent },
  { path: 'api_keys', component: ApiKeysComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ApiKeysRoutingModule {}
