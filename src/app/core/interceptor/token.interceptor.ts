import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { catchError, EMPTY, finalize, Observable, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  token:string='';

  constructor(private router:Router,
            private authService:AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    /*
    setTimeout(()=>{ //corrige error NG0100: Expression has changed after it was checked
      this.spinnerService.isLoading.next(true); 
    },0);*/
    
    
      if(this.authService.isLoggedIn()){

        this.token = this.authService.getToken();

        request = request.clone({
          
          setHeaders:{
            Authorization: `Bearer ${ this.token }`
          }
        });
      }
    
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        
       

        //if (err.status === 404) {
          // Ignorar el error 404 y devolver un valor por defecto
          //return EMPTY; // Esto evita el log en consola y maneja el error de forma silenciosa
        //}
        
        if (err.status === 403 || err.status === 401 || err.status==0) {

          
            this.authService.logout();
          
          //alert('No iniciaste sesión, favor logueate!');

          this.router.navigate(['/auth/login']);
        }
        
        return throwError( err );

      }),
      finalize( ()=>{
        //this.spinnerService.isLoading.next(false); 
                
      }

      )
    );;
  }
}
