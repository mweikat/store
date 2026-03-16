// src/app/core/tenants/tenant.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TenantService } from './tenants.service';


@Injectable()
export class TenantInterceptor implements HttpInterceptor {

  constructor(private tenantService: TenantService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    try {
      const businessId = this.tenantService.getBusinessId();
      //console.log('busnessId---------> ', businessId);
      const tenantReq = req.clone({
        setHeaders: {
          'businessId': businessId
        }
      });

      return next.handle(tenantReq);
    } catch (error) {
      // Si el TenantService no está inicializado, continuar sin el header
      //console.warn('TenantService not initialized, proceeding without businessId');
      return next.handle(req);
    }
  }
}