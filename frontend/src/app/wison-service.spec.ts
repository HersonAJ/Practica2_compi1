import { TestBed } from '@angular/core/testing';

import { WisonService } from './wison-service';

describe('WisonService', () => {
  let service: WisonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WisonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
