import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MealPrepComponent } from './meal-prep.component';

describe('MealPrepComponent', () => {
  let component: MealPrepComponent;
  let fixture: ComponentFixture<MealPrepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MealPrepComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MealPrepComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
