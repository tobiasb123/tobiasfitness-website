import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DataHolderComponent } from './data-holder/data-holder.component';

@Component({
  selector: 'app-admin-menu',
  imports: [RouterModule, DataHolderComponent],
  templateUrl: './admin-menu.component.html',
  styleUrl: './admin-menu.component.scss',
})
export class AdminMenuComponent {}
