import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricesComp } from '../components/prices.component';

describe('PricesComponent', () => {
  let component: PricesComp;
  let fixture: ComponentFixture<PricesComp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricesComp],
    }).compileComponents();

    fixture = TestBed.createComponent(PricesComp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
