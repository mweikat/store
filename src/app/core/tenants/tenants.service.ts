// src/app/core/tenants/tenant.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { BusinessModel } from '@models/business.model';
import { BusinessService } from '@services/business.service';
import { BehaviorSubject, Observable } from 'rxjs';



@Injectable({ providedIn: 'root' })
export class TenantService {

  private currentBusiness: BusinessModel | undefined = undefined;
  private static readonly domainCache = new Map<string, BusinessModel>();
  private styleElement: HTMLLinkElement | null = null;

  // BehaviorSubject para compartir globalmente
  private businessSubject = new BehaviorSubject<BusinessModel | null>(null);
  public business$: Observable<BusinessModel | null> = this.businessSubject.asObservable();

  constructor(
    private businessApi: BusinessService,
    @Inject(PLATFORM_ID) private platformId: any,
     @Inject(DOCUMENT) private document: Document,
  ) {}

  async initialize(): Promise<void> {

    const domain = await this.businessApi.getNameHost();
    //console.log('🔍 Resolviendo tenant para dominio:', domain);

    // Verificar cache primero
    const cached = TenantService.domainCache.get(domain);
    if (cached) {
      this.currentBusiness = cached;
      this.businessSubject.next(cached);
      await this.loadBusinessStyles();
      return;
    }

    try {
      // Llamar al API para obtener datos del business
      
      this.currentBusiness = await this.businessApi.getBusinessHost(domain).toPromise();
      
      if (!this.currentBusiness) {
        throw new Error(`No se encontró business para el dominio: ${domain}`);
      }

      // Cachear el resultado
      TenantService.domainCache.set(domain, this.currentBusiness);
      this.businessSubject.next(this.currentBusiness); // ← EMITIR GLOBALMENTE
      // Cargar estilos específicos del business
      await this.loadBusinessStyles();

      //console.log('✅ Tenant configurado:', this.currentBusiness.url);
      
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

  private async loadBusinessStyles_(): Promise<void> {

    if (!this.currentBusiness) return;

    if (isPlatformBrowser(this.platformId)) {
      // Remover estilos anteriores si existen
      if (this.styleElement) {
        document.head.removeChild(this.styleElement);
        this.styleElement = null;
      }

      // Cargar nuevos estilos del business
      this.styleElement = document.createElement('link');
      this.styleElement.rel = 'stylesheet';
      this.styleElement.href = `/assets/styles/${this.currentBusiness.url}/${this.currentBusiness.url}.css`;
      
      // Esperar a que los estilos se carguen
      await new Promise((resolve, reject) => {
        this.styleElement!.onload = resolve;
        this.styleElement!.onerror = reject;
        document.head.appendChild(this.styleElement!);
      });
    }
  }

  private loadBusinessStyles(){

    if (!this.currentBusiness) return;

    if (isPlatformServer(this.platformId)) {
      // Remover estilos anteriores si existen
      if (this.styleElement) {
        this.document.head.removeChild(this.styleElement);
        this.styleElement = null;
      }

      // Cargar nuevos estilos del business
      this.styleElement = this.document.createElement('link');
      this.styleElement.rel = 'stylesheet';
      this.styleElement.href = `/assets/styles/${this.currentBusiness.url}/${this.currentBusiness.url}.css`;

      this.document.head.appendChild(this.styleElement);
      
    }
  }

  // Para limpiar cache (útil en desarrollo)
  static clearCache(): void {
    this.domainCache.clear();
  }
}