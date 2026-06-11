import { TestBed } from '@angular/core/testing';

import { PassStateService } from './pass-state.service';

describe('PassStateService', () => {
  let service: PassStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PassStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
