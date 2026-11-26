import { NgModule } from '@angular/core';

import { ThemeModule } from '../../@theme/theme.module';
import { UserRoutingModule, routedComponents } from './user-routing.module';
import { MatTableModule } from '@angular/material/table';
import { CdkTableModule } from '@angular/cdk/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { EqualValidator } from './password.match.directive';
import { NbCardModule, NbIconModule, NbSpinnerModule, NbButtonModule, NbProgressBarModule } from '@nebular/theme';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { from } from 'rxjs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@NgModule({
  imports: [
    ThemeModule,
    NbSpinnerModule,
    UserRoutingModule,
    MatTableModule,
    CdkTableModule,
    MatSortModule,
    MatButtonModule,
    MatPaginatorModule,
    MatRadioModule,
    NbCardModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    NbIconModule,
    TranslateModule,
    NbButtonModule,
    NbProgressBarModule,
    MatSlideToggleModule

  ],

  declarations: [
    EqualValidator,
    ...routedComponents,
  ],
})
export class UserModule { }
