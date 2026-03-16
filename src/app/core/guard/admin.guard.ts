import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private router:Router, @Inject(PLATFORM_ID) private platformId: Object){}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if(isPlatformBrowser(this.platformId)){
      const userStorage = localStorage.getItem('access_token');
      if(!userStorage){
        return this.router.navigate(['/auth/login']);
      }
    }

    return true;
    
  }
   
}
