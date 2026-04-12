import { TestBed } from '@angular/core/testing';

import { AuthFunctionsService } from './auth-functions.service';

describe('AuthFunctionsService', () => {
  let service: AuthFunctionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthFunctionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
