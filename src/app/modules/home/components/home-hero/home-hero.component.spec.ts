import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DocumentFile } from '@models/storage';
import { AUTH_STATE } from '@modules/auth';
import { vi } from 'vitest';
import { HomeHeroComponent } from './home-hero.component';

describe('HomeHeroComponent', () => {
  it('shows no image until an uploaded hero image is available', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AUTH_STATE, useValue: signal('ready') }],
    });
    const fixture = TestBed.createComponent(HomeHeroComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.slide')).toBeNull();

    const uploaded: DocumentFile = {
      id: 'hero',
      uid: 'all',
      filePath: '',
      fileType: 'hero',
      fileName: '',
      folderPath: '',
      fileUrl: 'https://example.com/hero.jpg',
      timeCreated: '',
    };
    fixture.componentRef.setInput('images', [uploaded]);
    fixture.detectChanges();
    const image: HTMLImageElement = fixture.nativeElement.querySelector('.slide');
    expect(image.getAttribute('srcset')).toBeNull();
    expect(image.getAttribute('src')).toBe(uploaded.fileUrl);
    fixture.componentRef.setInput('images', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.slide')).toBeNull();
    fixture.destroy();
    vi.unstubAllGlobals();
  });
});
