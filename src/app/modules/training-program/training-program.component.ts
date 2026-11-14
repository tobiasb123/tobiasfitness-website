import {
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  afterNextRender,
  ElementRef,
  inject,
  Injector,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { TrainingProgram } from '@models/training';
import { intensityLabel, parseIntensity } from '@models/training/intensity';
import { AuthFunctionsService } from '@modules/auth';
import { toPng } from 'html-to-image';
import { AdminFacade } from '../admin-menu';
import moment from '../core/helpers/date-time';
import { DetailNavigationService } from '../core/services/detail-navigation.service';
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
  private readonly route = inject(ActivatedRoute);
  private readonly detailNavigation = inject(DetailNavigationService);
  private readonly injector = inject(Injector);
  private readonly overview = viewChild<ElementRef<HTMLElement>>('overview');
  private readonly backButton = viewChild<ElementRef<HTMLButtonElement>>('backButton');

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
  private selectionVersion = 0;

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

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const previousId = this.selectedId();
      const id = params.get('program');
      this.selectedId.set(id);
      if (id !== previousId) {
        this.selectionVersion++;
        this.closePreview();
        if (id !== null) {
          this.tab.set('mine');
          afterNextRender(
            () => (this.backButton() ?? this.overview())?.nativeElement.focus(),
            { injector: this.injector },
          );
        } else if (previousId !== null) {
          afterNextRender(() => this.overview()?.nativeElement.focus(), { injector: this.injector });
        }
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadMyPrograms();
  }

  async showTab(tab: AdminTab): Promise<void> {
    if (tab !== 'mine' && this.selectedId() !== null) {
      if (!(await this.detailNavigation.clear(this.route, 'program'))) {
        return;
      }
    }
    this.tab.set(tab);

    if (tab === 'mine') {
      await this.loadMyPrograms();
    }
  }

  async toggleAllPrograms(): Promise<void> {
    if (this.selectedId() !== null) {
      if (!(await this.detailNavigation.clear(this.route, 'program'))) {
        return;
      }
    }
    this.showAll.update((value) => !value);
    await this.loadMyPrograms();
  }

  openProgram(id: string): void {
    void this.detailNavigation.open(this.route, 'program', id);
  }

  closeProgram(): void {
    this.detailNavigation.close(this.route, 'program');
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
    const exercise = program.exercises.find((item) => item.id === change.exerciseId);
    const label = exercise ? intensityLabel(parseIntensity(exercise.intensity).unit) : 'Intensitet';

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
      this.toast.open(`${label === 'Vægt' ? 'Vægten' : 'Intensiteten'} blev opdateret`, 'success');
    } catch (error) {
      this.toast.open(this.messageOf(error, `${label === 'Vægt' ? 'Vægten' : 'Intensiteten'} kunne ikke gemmes`), 'error');
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
    const selectionVersion = this.selectionVersion;

    try {
      const images = await this.service.getProgramImages(program.id);

      if (this.selectedId() !== program.id || this.selectionVersion !== selectionVersion) {
        return;
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

      const preview = await toPng(sheet, {
        width, height, pixelRatio, backgroundColor: '#ffffff',
      });
      if (this.selectedId() === program.id && this.selectionVersion === selectionVersion) {
        this.previewUrl.set(preview);
      }
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
