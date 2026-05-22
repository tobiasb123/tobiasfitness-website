import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataEditerComponent } from './data-editer.component';

describe('DataEditerComponent', () => {
  let component: DataEditerComponent;
  let fixture: ComponentFixture<DataEditerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataEditerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataEditerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
