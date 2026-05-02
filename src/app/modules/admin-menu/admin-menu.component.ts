import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DataHolderComponent } from './data-holder/data-holder.component';
import { DataFinderComponent } from './data-finder/data-finder.component';
import { DataEditerComponent } from './data-editer/data-editer.component';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-admin-menu',
  imports: [RouterModule, DataHolderComponent, DataFinderComponent, DataEditerComponent],
  templateUrl: './admin-menu.component.html',
  styleUrl: './admin-menu.component.scss',
})
export class AdminMenuComponent {
  private _data$ = new BehaviorSubject([]);
  get data$() {
    return this._data$.asObservable();
  }
  private get data() {
    return this._data$.value;
  }

  constructor() {}

  addApointment(data: Array<{}>) {
    this._data$.next([...this.data, data]);
  }

  deleteApointment(data: Array<{}>) {
    for (let index = 0; index < this.data.length; index++) {
      const element = this.data[index];
      console.log(element);
    }
  }

  public apointments = this.data;
}
