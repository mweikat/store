// src/app/core/tenants/tenant.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { BusinessModel } from '@models/business.model';
import { BusinessService } from '@services/business.service';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private currentBusiness: BusinessModel | undefined = undefined;
  private static readonly domainCache = new Map<string, BusinessModel>();
  private styleElement: HTMLLinkElement | null = null;

  private businessSubject = new BehaviorSubject<BusinessModel | null>(null);
  public business$: Observable<BusinessModel | null> = this.businessSubject.asObservable();

  constructor(
    private businessApi: BusinessService,
    @Inject(PLATFORM_ID) private platformId: any,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  async initialize(): Promise<void> {
    const domain = this.businessApi.getNameHost();

    const cached = TenantService.domainCache.get(domain);
    if (cached) {
      this.currentBusiness = cached;
      this.businessSubject.next(cached);
      this.loadBusinessStyles();
      return;
    }

    try {
      this.currentBusiness = await firstValueFrom(this.businessApi.getBusinessHost(domain));
      
      if (!this.currentBusiness) {
        throw new Error(`No se encontró business para el dominio: ${domain}`);
      }

      TenantService.domainCache.set(domain, this.currentBusiness);
      this.businessSubject.next(this.currentBusiness);
      this.loadBusinessStyles();
    } catch (error) {
      console.error('❌ Error inicializando tenant:', error);
      throw error;
    }
  }

  getBusinessId(): string {
    if (!this.currentBusiness) {
      throw new Error('TenantService not initialized');
    }
    return this.currentBusiness.id;
  }

  getCurrentBusiness(): BusinessModel {
    if (!this.currentBusiness) {
      throw new Error('TenantService not initialized');
    }
    return this.currentBusiness;
  }

  private loadBusinessStyles(): void {
    if (!this.currentBusiness) return;

    const styleUrl = `/assets/styles/${this.currentBusiness.url}/${this.currentBusiness.url}.css`;

    if (isPlatformBrowser(this.platformId)) {
      if (this.styleElement) {
        this.document.head.removeChild(this.styleElement);
      }
      this.styleElement = this.document.createElement('link');
      this.styleElement.rel = 'stylesheet';
      this.styleElement.href = styleUrl;
      this.document.head.appendChild(this.styleElement);
    } else if (isPlatformServer(this.platformId)) {
      const link = this.document.createElement('link');
      link.rel = 'stylesheet';
      link.href = styleUrl;
      this.document.head.appendChild(link);
    }
  }

  static clearCache(): void {
    this.domainCache.clear();
  }
}
