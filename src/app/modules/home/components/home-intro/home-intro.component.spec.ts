import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DocumentFile } from '@models/storage';
import { HomeIntroComponent } from './home-intro.component';

describe('HomeIntroComponent', () => {
  it('shows no about image until an uploaded image is available', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(HomeIntroComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.about-me img')).toBeNull();

    const uploaded: DocumentFile = {
      id: 'about',
      uid: 'all',
      filePath: '',
      fileType: 'site',
      fileName: '',
      folderPath: '',
      fileUrl: 'https://example.com/uploaded.jpg',
      timeCreated: '',
    };
    fixture.componentRef.setInput('aboutImage', uploaded);
    fixture.detectChanges();
    const image: HTMLImageElement = fixture.nativeElement.querySelector('.about-me img');
    expect(image.getAttribute('src')).toBe(uploaded.fileUrl);
    fixture.componentRef.setInput('aboutImage', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.about-me img')).toBeNull();
  });
});
