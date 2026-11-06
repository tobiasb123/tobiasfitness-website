import {
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { UserProfile } from '@models/auth/interfaces';
import { TrainingProgram } from '@models/training';
import { AuthFunctionsService } from '@modules/auth';
import { toPng } from 'html-to-image';
import moment from 'moment-timezone';
import { AdminFacade } from '../admin-menu';
import { ToastService } from '../core/services/toast/toast.service';
import { TrainingLibraryComponent } from './components/training-library/training-library.component';
import { TrainingProgramEditorComponent } from './components/training-program-editor/training-program-editor.component';
import {
  TrainingSheetComponent,
  WeightChange,
} from './components/training-sheet/training-sheet.component';
import { TrainingProgramService } from './services/training-program.service';

type AdminTab = 'mine' | 'programs' | 'library';

@Component({
  selector: 'app-training-program',
  imports: [TrainingSheetComponent, TrainingLibraryComponent, TrainingProgramEditorComponent],
  templateUrl: './training-program.component.html',
  styleUrl: './training-program.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingProgramComponent implements OnInit {
  private service = inject(TrainingProgramService);
  private changeDetector = inject(ChangeDetectorRef);
  private authFunctions = inject(AuthFunctionsService);
  private adminFacade = inject(AdminFacade);
  private toast = inject(ToastService);

  readonly isAdmin = computed(() => Boolean(this.authFunctions.currentUserProfile()?.admin));
  readonly users = signal<UserProfile[]>([]);
  readonly tab = signal<AdminTab>('mine');

  readonly programs = signal<TrainingProgram[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly showArchived = signal(false);
  readonly showAll = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly savingExerciseId = signal<string | null>(null);

  readonly exporting = signal(false);
  readonly exportImages = signal<Record<string, string> | null>(null);
  readonly previewUrl = signal<string | null>(null);
  private readonly programSheet = viewChild<ElementRef<HTMLElement>>('programSheet');

  readonly archivedCount = computed(
    () => this.programs().filter((program) => program.status === 'archived').length,
  );

  readonly visiblePrograms = computed(() =>
    this.programs().filter((program) => this.showArchived() || program.status === 'active'),
  );

  readonly selected = computed(
    () => this.programs().find((program) => program.id === this.selectedId()) ?? null,
  );

  formatDate(value: string): string {
    return value ? moment(value).format('DD-MM-YYYY') : '';
  }

  private readonly usersEffect = effect(() => {
    if (this.isAdmin() && this.users().length === 0) {
      this.adminFacade.getUsers().subscribe((users) => this.users.set(users));
    }
  });

  async ngOnInit(): Promise<void> {
    await this.loadMyPrograms();
  }

  async showTab(tab: AdminTab): Promise<void> {
    this.tab.set(tab);

    if (tab === 'mine') {
      await this.loadMyPrograms();
    }
  }

  async toggleAllPrograms(): Promise<void> {
    this.showAll.update((value) => !value);
    this.selectedId.set(null);
    await this.loadMyPrograms();
  }

  isOwn(program: TrainingProgram): boolean {
    return program.assignedToUid === this.authFunctions.currentUserProfile()?.uid;
  }

  ownerName(program: TrainingProgram): string {
    const user = this.users().find((item) => item.uid === program.assignedToUid);
    return user ? `${user.firstName} ${user.lastName}` : program.clientName;
  }

  private async loadMyPrograms(): Promise<void> {
    this.loading.set(true);

    try {
      const programs =
        this.isAdmin() && this.showAll()
          ? await this.service.getAllPrograms()
          : await this.service.getMyPrograms();

      this.programs.set(programs);
      this.error.set('');
    } catch (error) {
      this.error.set(this.messageOf(error, 'Kunne ikke hente dine træningsprogrammer'));
    } finally {
      this.loading.set(false);
    }
  }

  async saveWeight(change: WeightChange): Promise<void> {
    const program = this.selected();

    if (!program) {
      return;
    }

    this.savingExerciseId.set(change.exerciseId);

    try {
      const input = {
        programId: program.id,
        ...change,
      };
      const updated = this.isAdmin()
        ? await this.service.updateAnyExerciseIntensity(input)
        : await this.service.updateMyExerciseWeight(input);

      this.programs.update((programs) =>
        programs.map((item) => (item.id === updated.id ? updated : item)),
      );
      this.toast.open('Intensiteten blev opdateret', 'success');
    } catch (error) {
      this.toast.open(this.messageOf(error, 'Intensiteten kunne ikke gemmes'), 'error');
    } finally {
      this.savingExerciseId.set(null);
    }
  }

  async createPng(): Promise<void> {
    const program = this.selected();

    if (!program || this.exporting()) {
      return;
    }

    this.exporting.set(true);

    try {
      const images = await this.service.getProgramImages(program.id);

      if (this.selectedId() !== program.id) {
        throw new Error('Træningsprogrammet blev ændret, mens billedet blev oprettet');
      }

      if (program.exercises.some((exercise) => exercise.imageUrl && !images[exercise.id])) {
        throw new Error('Et eller flere øvelsesbilleder kunne ikke hentes til billedet');
      }

      this.exportImages.set(images);
      this.changeDetector.detectChanges();

      const sheet = this.programSheet()?.nativeElement;

      if (!sheet) {
        throw new Error('Træningsprogrammet kunne ikke findes');
      }

      await this.waitForImages(sheet);
      const width = sheet.scrollWidth;
      const height = sheet.scrollHeight;

      if (width === 0 || height === 0) {
        throw new Error('Træningsprogrammet har ingen synlige dimensioner');
      }

      const pixelRatio = Math.min(
        2,
        Math.sqrt(12_000_000 / (width * height)),
        4096 / width,
        4096 / height,
      );

      this.previewUrl.set(
        await toPng(sheet, { width, height, pixelRatio, backgroundColor: '#ffffff' }),
      );
    } catch (error) {
      console.error('Kunne ikke oprette billede af træningsprogram', error);
      this.toast.open(this.messageOf(error, 'Billedet kunne ikke oprettes'), 'error');
    } finally {
      this.exportImages.set(null);
      this.exporting.set(false);
    }
  }

  closePreview(): void {
    this.previewUrl.set(null);
  }

  fileName(program: TrainingProgram): string {
    const base = `${program.title}-${program.clientName}`
      .toLowerCase()
      .replace(/[^a-z0-9æøå]+/gi, '-')
      .replace(/^-|-$/g, '');

    return `${base || 'traeningsprogram'}.png`;
  }

  private async waitForImages(host: HTMLElement): Promise<void> {
    const images = Array.from(host.querySelectorAll('img'));

    await Promise.all(images.map((image) => image.decode()));
  }

  private messageOf(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }
}
