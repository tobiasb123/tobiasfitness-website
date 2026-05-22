import { inject, Injectable } from '@angular/core';
import { CreateHotToastRef, HotToastService, ToastType } from '@ngxpert/hot-toast';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private hotToast = inject(HotToastService);

  public open(message: string, type: ToastType): CreateHotToastRef<unknown> {
    switch (type) {
      case 'info':
        return this.hotToast.info(message, {
          duration: this.getDuration(type),
        });
      case 'warning':
        return this.hotToast.warning(message, {
          duration: this.getDuration(type),
        });
      case 'error':
        return this.hotToast.error(message, {
          duration: this.getDuration(type),
        });
      case 'success':
        return this.hotToast.success(message, {
          duration: this.getDuration(type),
        });
      case 'loading':
        return this.hotToast.loading(message, {
          autoClose: false,
        });
      default:
        throw new Error('Toast type unknown');
    }
  }

  public update(ref: CreateHotToastRef<unknown>, message?: string, type?: ToastType): void {
    if (message) {
      ref.updateMessage(message);
    }
    if (type) {
      ref.updateToast({
        type,
      });

      if (type !== 'loading') {
        setTimeout(() => {
          ref.close({
            dismissedByAction: true,
          });
        }, this.getDuration(type));
      }
    }
  }

  private getDuration(type: ToastType): number {
    return type === 'error' ? 6000 : 4000;
  }
}
