import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignupComp } from './signup.component';

describe('SignupComp', () => {
  let component: SignupComp;
  let fixture: ComponentFixture<SignupComp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignupComp],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupComp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
