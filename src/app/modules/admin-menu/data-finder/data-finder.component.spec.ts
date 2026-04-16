import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataFinderComponent } from './data-finder.component';

describe('DataFinderComponent', () => {
  let component: DataFinderComponent;
  let fixture: ComponentFixture<DataFinderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataFinderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataFinderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
