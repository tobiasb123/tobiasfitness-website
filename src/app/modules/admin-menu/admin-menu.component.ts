import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DataHolderComponent } from './data-holder/data-holder.component';
import { DataFinderComponent } from './data-finder/data-finder.component';

@Component({
  selector: 'app-admin-menu',
  imports: [RouterModule, DataHolderComponent, DataFinderComponent],
  templateUrl: './admin-menu.component.html',
  styleUrl: './admin-menu.component.scss',
})
export class AdminMenuComponent {}
