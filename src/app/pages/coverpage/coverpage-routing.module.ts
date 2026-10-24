import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CoverpageComponent } from './coverpage.component';
import { FormCoverpageComponent } from './coverpage-component';
import { AddCoverpageComponent } from './coverpage-form-component';


const routes: Routes = [
  {path: '' ,component:CoverpageComponent ,
  children: [{
    path: 'coverpage',
    component: FormCoverpageComponent,
  },
  {
    path : 'coverpage/new' ,
    component : AddCoverpageComponent
  },
  {
    path : 'coverpage/:id' ,
    component : AddCoverpageComponent
  },

]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoverpageRoutingModule { }
export const routedComponents = [
  CoverpageComponent,
  FormCoverpageComponent,
  AddCoverpageComponent
]
  
