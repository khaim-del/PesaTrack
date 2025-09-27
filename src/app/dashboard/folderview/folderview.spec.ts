import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Folderview } from './folderview';

describe('Folderview', () => {
  let component: Folderview;
  let fixture: ComponentFixture<Folderview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Folderview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Folderview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
