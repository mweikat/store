import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { SpinnerService } from '@services/spinner.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class GenericInterceptor implements HttpInterceptor {

  constructor(private spinnerService:SpinnerService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    this.spinnerService.show(); 

    return next.handle(request).pipe(
      finalize( () => {
        this.spinnerService.hide();
      })
    );
  }
}