import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Review } from '@models/storage';
import { AuthFacade } from '@modules/auth';
import { UploadTaskSnapshot } from 'firebase/storage';
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

  displayFileName(file: string) {
    let fileDisplayName = document.getElementById('fileName');
    if (file) {
      fileDisplayName.textContent = file;
    } else {
      fileDisplayName.textContent = 'Ingen Fil';
    }
  }

  onSubmit(img: HTMLInputElement): void {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const file = img.files?.[0] ?? null;

    if (!file) {
      this.imageControl.markAsTouched();
      return;
    }

    this.saveReview(file);
  }

  private async saveReview(file: File) {
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

    const updatedDocument = await this.activeUpload.promise;
    this.finishUpload();
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
