import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { FirebaseService } from '@modules/firebase';
import { DataEditerComponent } from '../data-editer/data-editer.component';

@Component({
  selector: 'app-data-holder',
  imports: [RouterModule, DataEditerComponent],
  templateUrl: './data-holder.component.html',
  styleUrl: './data-holder.component.scss',
})
export class DataHolderComponent implements OnInit {
  private firebaseService = inject(FirebaseService);

  allUsers = signal<UserProfile[]>([]);
  selectedUser = signal<UserProfile>(undefined);

  ngOnInit(): void {
    this.firebaseService.httpGet<UserProfile[]>('admin-getUsers').then((users) => {
      this.allUsers.set(users);
    });
  }

  selectUser(uid: string) {
    const user = this.allUsers().find((u) => u.uid === uid);
    this.selectedUser.set(user);
  }

  editer = document.getElementsByClassName('editer');
  openEditer() {
    if (this.editer[0].lastChild) {
      let children = this.editer[0].children;
      for (let index = 0; index < children.length; index++) {
        const element = children[index] as Element;
        if (!element.classList.contains('active')) {
          element.classList.add('active');
        }
      }
    }
  }

  viewButtons = document.getElementsByClassName('view-option');
  selectView(event: any) {
    for (let index = 0; index < this.viewButtons.length; index++) {
      const element = this.viewButtons[index];
      if (element) {
        if (element.classList.contains('active')) {
          element.classList.remove('active');
          break;
        }
      }
    }
    event.target.classList.add('active');
    this.setActiveEditerTab(event.target.innerHTML);
  }

  allViews = document.getElementsByClassName('view');
  setActiveEditerTab(name: string) {
    for (let index = 0; index < this.allViews.length; index++) {
      const element = this.allViews[index];
      if (element) {
        if (element.classList.contains('active')) {
          element.classList.remove('active');
        }

        if (element.classList.contains(name)) {
          element.classList.add('active');
        }
      }
    }
  }
}
