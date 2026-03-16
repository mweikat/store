import { Component, OnInit } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { UserService } from '@services/user.service';

@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html',
    styleUrl: './logout.component.scss',
    standalone: false
})
export class LogoutComponent implements OnInit{

  constructor(private authService:AuthService){}

  ngOnInit(): void {
    this.authService.logout();
  }

  

}
