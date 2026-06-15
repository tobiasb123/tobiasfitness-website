import { TestBed } from '@angular/core/testing';

import { ContactFunctionsService } from './contact-functions.service';

describe('ContactFunctionsService', () => {
  let service: ContactFunctionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContactFunctionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
