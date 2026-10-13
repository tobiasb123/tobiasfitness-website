import {
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
  readonly exportProgram = signal<TrainingProgram | null>(null);
  readonly exportImages = signal<Record<string, string> | null>(null);
  readonly previewUrl = signal<string | null>(null);
  private readonly exportHost = viewChild<ElementRef<HTMLElement>>('exportHost');

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
      const updated = await this.service.updateMyExerciseWeight({
        programId: program.id,
        ...change,
      });

      this.programs.update((programs) =>
        programs.map((item) => (item.id === updated.id ? updated : item)),
      );
      this.toast.open('Vægten blev opdateret', 'success');
    } catch (error) {
      this.toast.open(this.messageOf(error, 'Vægten kunne ikke gemmes'), 'error');
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
      // Images are fetched server-side as data URLs so the canvas is never tainted by CORS
      const images = await this.service.getProgramImages(program.id);
      this.exportImages.set(images);
      this.exportProgram.set(program);

      const host = await this.waitForExportHost();
      await this.waitForImages(host);
      this.previewUrl.set(await toPng(host, { pixelRatio: 2, backgroundColor: '#ffffff' }));
    } catch (error) {
      this.toast.open(this.messageOf(error, 'Billedet kunne ikke oprettes'), 'error');
    } finally {
      this.exportProgram.set(null);
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

  private async waitForExportHost(): Promise<HTMLElement> {
    for (let attempt = 0; attempt < 40; attempt++) {
      const host = this.exportHost()?.nativeElement;

      if (host) {
        return host;
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    throw new Error('Billedet kunne ikke oprettes');
  }

  private async waitForImages(host: HTMLElement): Promise<void> {
    const images = Array.from(host.querySelectorAll('img'));

    await Promise.all(images.map((image) => image.decode().catch((): void => undefined)));
  }

  private messageOf(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }
}
