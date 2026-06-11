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

  it('should initialize with false', () => {
    expect(service.usingPass$()).toBe(false);
  });

  it('should set usingPass value', () => {
    service.setUsingPass(true);
    expect(service.usingPass$()).toBe(true);
  });
});
