import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { catchError, finalize, Observable, throwError, EMPTY } from 'rxjs';
import { SpinnerService } from '@services/spinner.service';

@Injectable()
export class GenericInterceptor implements HttpInterceptor {

  constructor(private spinnerService:SpinnerService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    const shouldShowSpinner = request.method !== 'GET' || request.headers.has('X-Show-Spinner');

    if (shouldShowSpinner) {
      this.spinnerService.show();
    }

    return next.handle(request).pipe(
      catchError((error) => {
        if (
          error?.name === 'AbortError' ||
          error?.message?.includes('signal is aborted') ||
          error?.error?.name === 'AbortError'
        ) {
          return EMPTY;
        }
        return throwError(() => error);
      }),
      finalize(() => {
        if (shouldShowSpinner) {
          this.spinnerService.hide();
        }
      })
    );
  }
}