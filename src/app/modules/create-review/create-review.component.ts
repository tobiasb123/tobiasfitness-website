import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Review } from '@models/storage';
import { AuthFacade } from '@modules/auth';
import { FirebaseError } from 'firebase/app';
import { uploadPercentage } from '../core/helpers/upload-progress';
import { ToastService } from '../core/services/toast/toast.service';
import { StorageFunctions } from '../meal-prep/services/storage-functions.service';

@Component({
  selector: 'app-create-review',
  imports: [RouterModule, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './create-review.component.html',
  styleUrl: './create-review.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateReviewComponent {
  private storageFunctions = inject(StorageFunctions);
  private authFacade = inject(AuthFacade);
  private toast = inject(ToastService);
  private router = inject(Router);

  imageControl = new FormControl<string>('', [Validators.required]);
  reviewControl = new FormControl<string>('', [Validators.required]);
  ratingControl = new FormControl<number>(null, [
    Validators.required,
    Validators.min(1),
    Validators.max(5),
  ]);

  formGroup = new FormGroup({
    image: this.imageControl,
    review: this.reviewControl,
    rating: this.ratingControl,
  });

  isUploading = signal(false);
  uploadProgress = signal<number | null>(null);
  selectedFileName = signal('Ingen Fil');

  onFileSelected(file: File | undefined): void {
    this.selectedFileName.set(file?.name.trim() || 'Ingen Fil');
  }

  onSubmit(img: HTMLInputElement): void {
    if (this.isUploading()) {
      return;
    }

    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const file = img.files?.[0] ?? null;

    if (!file) {
      this.imageControl.markAsTouched();
      return;
    }

    void this.saveReview(file);
  }

  private async saveReview(file: File): Promise<void> {
    const currentUser = this.authFacade.currentProfile();

    if (!currentUser) {
      this.toast.open('Du skal være logget ind for at oprette en anmeldelse.', 'error');
      return;
    }

    const review = <Review>{
      age: currentUser.age,
      fullName: `${currentUser.firstName} ${currentUser.lastName}`,
      rating: this.ratingControl.value,
      text: this.reviewControl.value,
    };

    this.isUploading.set(true);
    this.uploadProgress.set(null);

    try {
      const upload = this.storageFunctions.saveReview(file, review, currentUser.uid, (snapshot) =>
        this.uploadProgress.set(uploadPercentage(snapshot)),
      );
      await upload.promise;
      this.toast.open('Anmeldelse blev oprettet', 'success');
      await this.router.navigate(['/']);
    } catch (error: unknown) {
      const message = error instanceof FirebaseError || error instanceof Error ? error.message : '';

      if (error instanceof FirebaseError && error.code === 'storage/canceled') {
        this.toast.open('Upload blev annulleret', 'success');
        return;
      }

      this.toast.open(message || 'Der skete en ukendt fejl. Kunne ikke gemme anmeldelsen', 'error');
    } finally {
      this.isUploading.set(false);
      this.uploadProgress.set(null);
    }
  }
}
