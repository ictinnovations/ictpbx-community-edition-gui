import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticReportComponent } from './statistic-report.component';

describe('StatisticReportComponent', () => {
  let component: StatisticReportComponent;
  let fixture: ComponentFixture<StatisticReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StatisticReportComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatisticReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});