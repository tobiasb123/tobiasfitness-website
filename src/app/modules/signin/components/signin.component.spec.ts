import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SigninComp } from './signin.component';

describe('SigninComp', () => {
  let component: SigninComp;
  let fixture: ComponentFixture<SigninComp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SigninComp],
    }).compileComponents();

    fixture = TestBed.createComponent(SigninComp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
