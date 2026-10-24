import { TestBed } from '@angular/core/testing';

import { StatisticReportService } from './statistic-report.service';

describe('StatisticReportService', () => {
  let service: StatisticReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatisticReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});