import { Component, OnInit } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { RouteExt, routes } from '../../../../app.routes';

@Component({
  selector: 'app-nav',
  imports: [RouterModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent implements OnInit {
  routes: RouteExt[];

  ngOnInit(): void {
    this.routes = routes;
  }

  navList = document.getElementsByClassName('nav');

  openCloseNav() {
    console.log(this.navList.item(0)?.classList);
    if (this.navList.item(0)?.classList.contains('open')) {
      this.navList.item(0)?.classList.remove('open');
    } else {
      this.navList.item(0)?.classList.add('open');
    }
  }
}
