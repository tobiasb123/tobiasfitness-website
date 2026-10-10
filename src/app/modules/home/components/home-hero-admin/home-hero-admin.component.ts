import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DocumentFile } from '@models/storage';
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
  readonly changed = output<void>();

  readonly items = signal<DocumentFile[]>([]);
  readonly busy = signal(false);
  readonly status = signal('');
  readonly error = signal('');

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
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files?.length) {
      return;
    }

    const files = Array.from(input.files);
    input.value = '';
    this.error.set('');

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
        this.status.set(`Uploader billede ${uploaded + 1} af ${files.length}…`);
        await this.storageFunctions.uploadHeroImage(file).promise;
        uploaded++;
      }
      this.status.set(`${uploaded} billede(r) uploadet.`);
    } catch {
      this.error.set('Upload fejlede. Prøv igen.');
      this.status.set('');
    } finally {
      this.busy.set(false);
      if (uploaded > 0) {
        this.changed.emit();
      }
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
    this.items.set(reordered);

    try {
      await this.storageFunctions.reorderHeroImages(reordered.map((image) => image.id));
      this.status.set('Rækkefølgen er gemt.');
      this.changed.emit();
    } catch {
      this.items.set(previous);
      this.error.set('Rækkefølgen kunne ikke gemmes.');
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

    try {
      await this.storageFunctions.deleteHeroImage(image.id);
      this.status.set('Billedet er fjernet.');
      this.changed.emit();
    } catch {
      this.error.set('Billedet kunne ikke fjernes.');
    } finally {
      this.busy.set(false);
    }
  }
}
