import { Location } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class DetailNavigationService {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  open(route: ActivatedRoute, parameter: string, id: string): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: route,
      queryParams: { [parameter]: id },
      queryParamsHandling: 'merge',
      state: { detailOverview: parameter },
    });
  }

  close(route: ActivatedRoute, parameter: string): void {
    const state = this.location.getState();
    if (
      typeof state === 'object' &&
      state !== null &&
      'detailOverview' in state &&
      state.detailOverview === parameter
    ) {
      this.location.back();
      return;
    }

    void this.clear(route, parameter);
  }

  clear(route: ActivatedRoute, parameter: string): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: route,
      queryParams: { [parameter]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
