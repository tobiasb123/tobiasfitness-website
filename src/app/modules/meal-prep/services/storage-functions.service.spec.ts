import { TestBed } from '@angular/core/testing';

import { StorageFunctions } from './storage-functions.service';

describe('StorageFunctions', () => {
  let service: StorageFunctions;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageFunctions);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
