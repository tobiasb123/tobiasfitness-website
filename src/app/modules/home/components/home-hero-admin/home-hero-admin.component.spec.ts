import { TestBed } from '@angular/core/testing';
import { DocumentFile } from '@models/storage';
import { vi } from 'vitest';
import { StorageFunctions } from '../../../meal-prep/services/storage-functions.service';
import { HomeHeroAdminComponent } from './home-hero-admin.component';

describe('HomeHeroAdminComponent image previews', () => {
  it('shows a color for the empty about slot and preserves other image previews', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: StorageFunctions, useValue: {} }],
    });
    const fixture = TestBed.createComponent(HomeHeroAdminComponent);
    fixture.componentRef.setInput('images', []);
    fixture.detectChanges();

    const slots: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('.services-image');
    expect(slots[0].querySelector('img')).toBeNull();
    expect(slots[0].textContent).toContain('Intet billede valgt');
    expect(slots[1].querySelector('img')?.getAttribute('src')).toBe('GymBackground.jpg');

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
    expect(slots[0].querySelector('img')?.getAttribute('src')).toBe(uploaded.fileUrl);
    expect(slots[0].textContent).toContain('Eget billede');
  });

  it('reports upload progress and clears the busy state after an error', async () => {
    let reportProgress: (snapshot: { bytesTransferred: number; totalBytes: number }) => void;
    let rejectUpload: (error: Error) => void;
    const pending = new Promise<never>((_, reject) => {
      rejectUpload = reject;
    });
    const uploadSiteImage = vi.fn((_file, _slot, progress) => {
      reportProgress = progress;
      return { promise: pending };
    });
    TestBed.configureTestingModule({
      providers: [{ provide: StorageFunctions, useValue: { uploadSiteImage } }],
    });
    const fixture = TestBed.createComponent(HomeHeroAdminComponent);
    fixture.componentRef.setInput('images', []);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#about-upload');
    Object.defineProperty(input, 'files', {
      value: [new File(['image'], 'photo.png', { type: 'image/png' })],
    });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.busy()).toBe(true);
    reportProgress({ bytesTransferred: 25, totalBytes: 100 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('progress').value).toBe(25);
    rejectUpload(new Error('Unavailable'));
    await vi.waitFor(() => expect(fixture.componentInstance.busy()).toBe(false));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('progress')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Upload fejlede',
    );
  });
});
