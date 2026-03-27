import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantService } from './tenants.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantService = inject(TenantService);

  try {
    const businessId = tenantService.getBusinessId();
    const tenantReq = req.clone({
      setHeaders: {
        'businessId': businessId
      }
    });
    return next(tenantReq);
  } catch (error) {
    return next(req);
  }
};
