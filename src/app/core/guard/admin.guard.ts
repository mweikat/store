import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private router:Router, @Inject(PLATFORM_ID) private platformId: Object, private authService: AuthService){}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if(isPlatformBrowser(this.platformId)){
      const userStorage = this.authService.getToken();
      //console.log('AdminGuard - userStorage:', state);
      //console.log('AdminGuard - userStorage:', route);
      if(!userStorage){
        return this.router.navigate(['/auth/login']);
      }
    }

    return true;
    
  }
   
}
