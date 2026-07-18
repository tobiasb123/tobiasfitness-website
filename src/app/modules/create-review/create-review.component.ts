import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-create-review',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './create-review.component.html',
  styleUrl: './create-review.component.scss',
})
export class CreateReviewComponent {
  imageControl = new FormControl<string>('', [Validators.required]);
  reviewControl = new FormControl<string>('', [Validators.required]);

  formGroup = new FormGroup({
    image: this.imageControl,
    review: this.reviewControl,
  });

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

  onSubmit(event: any) {
    // Save image and review to storage, not firestore.
  }
}
