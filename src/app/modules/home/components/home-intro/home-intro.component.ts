import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DocumentFile } from '@models/storage';

@Component({
  selector: 'app-home-intro',
  imports: [NgOptimizedImage, RouterModule],
  templateUrl: './home-intro.component.html',
  styleUrl: './home-intro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeIntroComponent {
  readonly servicesImage = input<DocumentFile | null>(null);
  readonly aboutImage = input<DocumentFile | null>(null);
}
