import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DevicesComponent } from './devices.component';
import { DeviceListComponent } from './device-list.component';
import { DeviceFormComponent } from './device-form.component';
import { DeviceProfileListComponent } from './device-profile-list.component';
import { DeviceProfileFormComponent } from './device-profile-form.component';

const routes: Routes = [{
  path: '',
  component: DevicesComponent,
  children: [
    { path: 'devices',       component: DeviceListComponent },
    { path: 'devices/new',   component: DeviceFormComponent },
    { path: 'devices/:id',   component: DeviceFormComponent },
    { path: 'profiles',      component: DeviceProfileListComponent },
    { path: 'profiles/new',  component: DeviceProfileFormComponent },
    { path: 'profiles/:id',  component: DeviceProfileFormComponent },
  ],
}];

export const routedComponents = [
  DevicesComponent,
  DeviceListComponent,
  DeviceFormComponent,
  DeviceProfileListComponent,
  DeviceProfileFormComponent,
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DevicesRoutingModule {}
