import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NbButtonModule, NbIconModule, NbInputModule,
  NbSelectModule, NbTooltipModule,
} from '@nebular/theme';
import { RecordingPickerComponent } from './recording-picker.component';

@NgModule({
  imports: [
    CommonModule, FormsModule,
    NbButtonModule, NbIconModule, NbInputModule, NbSelectModule, NbTooltipModule,
  ],
  declarations: [RecordingPickerComponent],
  exports: [RecordingPickerComponent],
})
export class RecordingPickerModule {}
