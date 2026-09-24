// src/app/core/tenants/tenant.service.ts
import { Injectable, Inject, PLATFORM_ID, DOCUMENT, TransferState, makeStateKey } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { BusinessModel } from '@models/business.model';
import { BusinessService } from '@services/business.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const TENANT_KEY = makeStateKey<BusinessModel>('tenant_business');

@Injectable({ providedIn: 'root' })
export class TenantService {

  private readonly ENVIRONMENT = environment.production;
  private currentBusiness: BusinessModel | undefined = undefined;
  private static readonly domainCache = new Map<string, BusinessModel>();
  private styleElement: HTMLLinkElement | null = null;

  // BehaviorSubject para compartir globalmente
  private businessSubject = new BehaviorSubject<BusinessModel | null>(null);
  public business$: Observable<BusinessModel | null> = this.businessSubject.asObservable();

  constructor(
    private businessApi: BusinessService,
    private transferState: TransferState,
    @Inject(PLATFORM_ID) private platformId: any,
     @Inject(DOCUMENT) private document: Document,
  ) {}

  async initialize(): Promise<void> {

    const domain = await this.businessApi.getNameHost();

    // 1. Verificar cache en memoria primero
    const cached = TenantService.domainCache.get(domain);
    if (cached) {
      this.currentBusiness = cached;
      this.businessSubject.next(cached);
      await this.loadBusinessStyles(domain);
      return;
    }

    // 2. Verificar TransferState (cuando el cliente hidrata desde SSR)
    if (isPlatformBrowser(this.platformId)) {
      const transferBusiness = this.transferState.get(TENANT_KEY, null);
      if (transferBusiness && transferBusiness.id) {
        this.currentBusiness = transferBusiness;
        TenantService.domainCache.set(domain, transferBusiness);
        this.businessSubject.next(transferBusiness);
        await this.loadBusinessStyles(domain);
        return;
      }

      // 3. Verificar localStorage si existe
      const storedBusiness = this.businessApi.getBusinessStorage();
      if (storedBusiness && storedBusiness.id) {
        this.currentBusiness = storedBusiness;
        TenantService.domainCache.set(domain, storedBusiness);
        this.businessSubject.next(storedBusiness);
        await this.loadBusinessStyles(domain);
        return;
      }
    }

    try {
      // Llamar al API para obtener datos del business si no estaba en cache/TransferState
      this.currentBusiness = await this.businessApi.getBusinessHost(domain).toPromise();
      
      if (!this.currentBusiness) {
        throw new Error(`No se encontró business para el dominio: ${domain}`);
      }

      if (isPlatformServer(this.platformId)) {
        this.transferState.set(TENANT_KEY, this.currentBusiness);
      }

      // Cachear el resultado
      TenantService.domainCache.set(domain, this.currentBusiness);
      this.businessSubject.next(this.currentBusiness);
      await this.loadBusinessStyles(domain);
      
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

  /*private async loadBusinessStyles_(): Promise<void> {

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
  }*/

  private async loadBusinessStyles(domain:string){

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
      //this.styleElement.href = `/assets/styles/${this.currentBusiness.url}/${this.currentBusiness.url}.css`;
      if(this.ENVIRONMENT){
        //console.log('Entra production: ', `https://${domain}.cl/assets/styles/${this.currentBusiness.url}/${this.currentBusiness.url}.css`);
        this.styleElement.href = `https://${domain}.cl/assets/styles/${this.currentBusiness.url}/${this.currentBusiness.url}.css`;
      }else
        this.styleElement.href = `http://localhost:4000/assets/styles/${this.currentBusiness.url}/${this.currentBusiness.url}.css`;

      this.document.head.appendChild(this.styleElement);
      
    }else{
      await this.businessApi.setBusiness(this.currentBusiness);
    }
  }

  // Para limpiar cache (útil en desarrollo)
  static clearCache(): void {
    this.domainCache.clear();
  }
}