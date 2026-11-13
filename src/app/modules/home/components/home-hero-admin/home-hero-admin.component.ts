import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DocumentFile } from '@models/storage';
import { uploadPercentage } from '../../../core/helpers/upload-progress';
import { StorageFunctions } from '../../../meal-prep/services/storage-functions.service';

const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;

@Component({
  selector: 'app-home-hero-admin',
  imports: [NgOptimizedImage],
  templateUrl: './home-hero-admin.component.html',
  styleUrl: './home-hero-admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHeroAdminComponent {
  private readonly storageFunctions = inject(StorageFunctions);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly images = input.required<DocumentFile[]>();
  readonly servicesImage = input<DocumentFile | null>(null);
  readonly aboutImage = input<DocumentFile | null>(null);
  readonly changed = output<void>();

  readonly siteSlots = computed(() => [
    {
      id: 'about',
      title: 'Billede til "Om mig"',
      image: this.aboutImage(),
      fallback: null,
    },
    {
      id: 'services',
      title: 'Billede til "Hvad kan jeg hjælpe dig med?"',
      image: this.servicesImage(),
      fallback: 'GymBackground.jpg',
    },
  ]);

  readonly items = signal<DocumentFile[]>([]);
  readonly busy = signal(false);
  readonly status = signal('');
  readonly error = signal('');
  readonly uploadProgress = signal<number | null>(null);

  private readonly syncItems = effect(() => {
    this.items.set(this.images());
  });

  open(): void {
    this.error.set('');
    this.status.set('');
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  async onFilesSelected(event: Event): Promise<void> {
    if (this.busy()) {
      return;
    }
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files?.length) {
      return;
    }

    const files = Array.from(input.files);
    input.value = '';
    this.error.set('');
    this.status.set('');

    const invalidFile = files.find(
      (file) => !file.type.startsWith('image/') || file.size > MAX_IMAGE_SIZE_BYTES,
    );
    if (invalidFile) {
      this.error.set(`"${invalidFile.name}" skal være et billede på maks. 25 MB.`);
      return;
    }

    this.busy.set(true);
    let uploaded = 0;

    try {
      for (const file of files) {
        this.uploadProgress.set(null);
        this.status.set(`Uploader billede ${uploaded + 1} af ${files.length}…`);
        await this.storageFunctions.uploadHeroImage(file, (snapshot) =>
          this.uploadProgress.set(uploadPercentage(snapshot)),
        ).promise;
        uploaded++;
      }
      this.status.set(`${uploaded} billede(r) uploadet.`);
    } catch {
      this.error.set('Upload fejlede. Prøv igen.');
      this.status.set('');
    } finally {
      this.busy.set(false);
      this.uploadProgress.set(null);
      if (uploaded > 0) {
        this.changed.emit();
      }
    }
  }

  async onSiteImageSelected(event: Event, slot: string): Promise<void> {
    if (this.busy()) {
      return;
    }
    const input = event.target;
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    if (!(input instanceof HTMLInputElement) || !file) {
      return;
    }

    input.value = '';
    this.error.set('');
    this.status.set('');

    if (!file.type.startsWith('image/') || file.size > MAX_IMAGE_SIZE_BYTES) {
      this.error.set(`"${file.name}" skal være et billede på maks. 25 MB.`);
      return;
    }

    this.busy.set(true);
    this.uploadProgress.set(null);
    this.status.set('Uploader billede…');

    try {
      await this.storageFunctions.uploadSiteImage(file, slot, (snapshot) =>
        this.uploadProgress.set(uploadPercentage(snapshot)),
      ).promise;
      this.status.set('Billedet er opdateret.');
      this.changed.emit();
    } catch {
      this.error.set('Upload fejlede. Prøv igen.');
      this.status.set('');
    } finally {
      this.busy.set(false);
      this.uploadProgress.set(null);
    }
  }

  async removeSiteImage(slot: string): Promise<void> {
    if (this.busy() || !window.confirm('Vil du fjerne dette billede?')) {
      return;
    }

    this.busy.set(true);
    this.error.set('');
    this.status.set('Fjerner billede…');

    try {
      await this.storageFunctions.deleteSiteImage(slot);
      this.status.set('Billedet er fjernet.');
      this.changed.emit();
    } catch {
      this.error.set('Billedet kunne ikke fjernes.');
      this.status.set('');
    } finally {
      this.busy.set(false);
    }
  }

  async move(index: number, direction: -1 | 1): Promise<void> {
    const targetIndex = index + direction;
    const previous = this.items();

    if (this.busy() || targetIndex < 0 || targetIndex >= previous.length) {
      return;
    }

    const reordered = [...previous];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    this.busy.set(true);
    this.error.set('');
    this.status.set('Gemmer rækkefølge…');
    this.items.set(reordered);

    try {
      await this.storageFunctions.reorderHeroImages(reordered.map((image) => image.id));
      this.status.set('Rækkefølgen er gemt.');
      this.changed.emit();
    } catch {
      this.items.set(previous);
      this.error.set('Rækkefølgen kunne ikke gemmes.');
      this.status.set('');
    } finally {
      this.busy.set(false);
    }
  }

  async remove(image: DocumentFile): Promise<void> {
    if (this.busy() || !window.confirm('Vil du fjerne dette billede?')) {
      return;
    }

    this.busy.set(true);
    this.error.set('');
    this.status.set('Fjerner billede…');

    try {
      await this.storageFunctions.deleteHeroImage(image.id);
      this.status.set('Billedet er fjernet.');
      this.changed.emit();
    } catch {
      this.error.set('Billedet kunne ikke fjernes.');
      this.status.set('');
    } finally {
      this.busy.set(false);
    }
  }
}
