import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Review } from '@models/storage';
import { AuthFacade } from '@modules/auth';
import { FirebaseError } from 'firebase/app';
import { UploadTaskSnapshot } from 'firebase/storage';
import { ToastService } from '../core/services/toast/toast.service';
import { ResumableUpload, StorageFunctions } from '../meal-prep/services/storage-functions.service';

@Component({
  selector: 'app-create-review',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './create-review.component.html',
  styleUrl: './create-review.component.scss',
})
export class CreateReviewComponent {
  private storageFunctions = inject(StorageFunctions);
  private authFacade = inject(AuthFacade);
  private toast = inject(ToastService);
  private router = inject(Router);

  private activeUpload: ResumableUpload = null;
  private uploadStartedAtMs: number = null;

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
  uploadProgress = signal(0);
  uploadEtaSeconds = signal<number>(null);

  selectFile(event: any) {
    event.target.parentElement.children[0].click();
  }

  displayFileName(fileName?: string | null): void {
    const fileDisplayName = document.getElementById('fileName');

    if (!fileDisplayName) {
      return;
    }

    fileDisplayName.textContent = fileName?.trim() || 'Ingen Fil';
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

    const review = <Review>{
      age: currentUser.age,
      fullName: `${currentUser.firstName} ${currentUser.lastName}`,
      rating: this.ratingControl.value,
      text: this.reviewControl.value,
    };

    this.startUpload();
    this.activeUpload = this.storageFunctions.saveReview(
      file,
      review,
      currentUser.uid,
      (snapshot) => this.handleUploadProgress(snapshot),
    );

    try {
      await this.activeUpload.promise;
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
      this.finishUpload();
    }
  }

  private handleUploadProgress(snapshot: UploadTaskSnapshot): void {
    const totalBytes = snapshot.totalBytes;

    if (!totalBytes) {
      this.uploadProgress.set(0);
      this.uploadEtaSeconds.set(null);
      return;
    }

    const progress = Math.floor((snapshot.bytesTransferred / totalBytes) * 100);
    this.uploadProgress.set(progress);

    if (!this.uploadStartedAtMs || snapshot.bytesTransferred <= 0) {
      this.uploadEtaSeconds.set(null);
      return;
    }

    const elapsedSeconds = (Date.now() - this.uploadStartedAtMs) / 1000;

    if (elapsedSeconds <= 0) {
      this.uploadEtaSeconds.set(null);
      return;
    }

    const bytesPerSecond = snapshot.bytesTransferred / elapsedSeconds;

    if (bytesPerSecond <= 0) {
      this.uploadEtaSeconds.set(null);
      return;
    }

    const remainingBytes = totalBytes - snapshot.bytesTransferred;
    const etaSeconds = Math.max(0, Math.ceil(remainingBytes / bytesPerSecond));

    this.uploadEtaSeconds.set(etaSeconds);
  }

  private startUpload(): void {
    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.uploadEtaSeconds.set(null);
    this.uploadStartedAtMs = Date.now();
  }

  private finishUpload(): void {
    this.activeUpload = null;
    this.isUploading.set(false);
    this.uploadProgress.set(0);
    this.uploadEtaSeconds.set(null);
    this.uploadStartedAtMs = null;
  }
}
