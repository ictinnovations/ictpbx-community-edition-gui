import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoverpageFormComponentComponent } from './coverpage-form-component.component';

describe('CoverpageFormComponentComponent', () => {
  let component: CoverpageFormComponentComponent;
  let fixture: ComponentFixture<CoverpageFormComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CoverpageFormComponentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CoverpageFormComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
