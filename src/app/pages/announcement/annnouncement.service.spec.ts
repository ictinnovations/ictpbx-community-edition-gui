import { TestBed } from '@angular/core/testing';

import { AnnnouncementService } from './annnouncement.service';

describe('AnnnouncementService', () => {
  let service: AnnnouncementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnnnouncementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
