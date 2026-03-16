// src/app/core/tenants/tenant.server.service.ts
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Injectable, Optional, Inject, REQUEST, PLATFORM_ID } from '@angular/core';
import { BusinessModel } from '@models/business.model';
import { BusinessService } from '@services/business.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class TenantServerService {



  constructor(
    private businessApi: BusinessService,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(REQUEST) private request: any
  ) {}

  async getBusinessForRequest(): Promise<BusinessModel|undefined> {
    // Obtener el dominio del request de Express
    const domain = await this.businessApi.getNameHost();
    return await this.businessApi.getBusinessHost(domain).toPromise();
  }

  /*private getDomainFromRequest(): string {
    if (!this.request) {
      return 'mipatita.cl'; // Fallback para desarrollo
    }

    // Obtener el hostname del request
    const host = this.request.get('host');
    if (host && host.includes('localhost')) {
      return 'mipatita.cl'; // Localhost usa mipatita
    }
    
    return host || 'mipatita.cl';
  }*/


}