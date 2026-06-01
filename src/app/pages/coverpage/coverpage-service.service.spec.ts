import { TestBed } from '@angular/core/testing';

import { CoverpageService } from './coverpage-service.service';

describe('CoverpageServiceService', () => {
  let service: CoverpageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoverpageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
