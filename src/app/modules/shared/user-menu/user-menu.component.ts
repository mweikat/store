import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { UserModel } from '@models/user.model';
import { AuthService } from '@services/auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-user-menu',
    templateUrl: './user-menu.component.html',
    styleUrl: './user-menu.component.scss',
    standalone: false
})
export class UserMenuComponent implements OnInit, OnDestroy{

  isLogged:boolean = false;
  user:UserModel = {} as UserModel;


  destroyUser?:Subscription;

  constructor(private authService:AuthService){

    this.isLogged = this.authService.isLoggedIn();

  }

  ngOnDestroy(): void {
    if(this.destroyUser)
      this.destroyUser.unsubscribe();
  }

  ngOnInit(): void {
    
      
      if(this.isLogged){
        
        this.user = this.authService.getUserFromLocalStorage();
        
        //setTimeout(() => {
        
        //}, 2000);

        
      }
       

    
      this.destroyUser = this.authService.currentUser.subscribe(user => {
        if(user.id!=undefined){
          this.user = user;
          this.isLogged = true;
        }
      });
  }
  

}
