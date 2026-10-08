// src/app/core/tenants/tenants.service.ts
import { Injectable, Inject, PLATFORM_ID, DOCUMENT, TransferState, makeStateKey } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { BusinessModel, BusinessThemeColorsModel, BusinessThemeTypographyModel } from '@models/business.model';
import { BusinessService } from '@services/business.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const TENANT_KEY = makeStateKey<BusinessModel>('tenant_business');

const DEFAULT_COLORS: Required<BusinessThemeColorsModel> = {
  primary: '#917f6e',
  primary_v1: '#6d5742',
  secondary: '#efbc98',
  tertiary: '#efd2be',
  quaternary: '#efe1d1',
  quaternary_v2: '#ffedd9',
  light_bg: '#ffffff',
  dark_text: '#000000',
  warning: '#ffbd59',
  warning_v1: 'rgba(253, 201, 13, 0.25)',
  price_color_1: '#e74c3c',
  link_color: '#efbc98',
  invalid_form_color: 'red'
};

const DEFAULT_TYPOGRAPHY: Required<BusinessThemeTypographyModel> = {
  font_family_main: '"Montserrat", sans-serif'
};

@Injectable({ providedIn: 'root' })
export class TenantService {

  private readonly ENVIRONMENT = environment.production;
  private currentBusiness: BusinessModel | undefined = undefined;
  private static readonly domainCache = new Map<string, BusinessModel>();

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
      await this.loadBusinessStyles();
      return;
    }

    // 2. Verificar TransferState (cuando el cliente hidrata desde SSR)
    if (isPlatformBrowser(this.platformId)) {
      const transferBusiness = this.transferState.get(TENANT_KEY, null);
      if (transferBusiness && transferBusiness.id) {
        this.currentBusiness = transferBusiness;
        TenantService.domainCache.set(domain, transferBusiness);
        this.businessSubject.next(transferBusiness);
        await this.loadBusinessStyles();
        return;
      }

      // 3. Verificar localStorage si existe
      const storedBusiness = this.businessApi.getBusinessStorage();
      if (storedBusiness && storedBusiness.id) {
        this.currentBusiness = storedBusiness;
        TenantService.domainCache.set(domain, storedBusiness);
        this.businessSubject.next(storedBusiness);
        await this.loadBusinessStyles();
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
      await this.loadBusinessStyles();
      
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

  private async loadBusinessStyles(): Promise<void> {
    if (!this.currentBusiness) return;

    const theme = this.currentBusiness.settings?.theme;
    const colors = { ...DEFAULT_COLORS, ...theme?.colors };
    const typography = { ...DEFAULT_TYPOGRAPHY, ...theme?.typography };

    const cssContent = `
      :root {
        --color-primary: ${colors.primary};
        --color-primary-v1: ${colors.primary_v1};
        --color-secondary: ${colors.secondary};
        --color-tertiary: ${colors.tertiary};
        --color-quaternary: ${colors.quaternary};
        --color-quaternary-v2: ${colors.quaternary_v2};
        --color-light-bg: ${colors.light_bg};
        --color-dark-text: ${colors.dark_text};
        --color-warning: ${colors.warning};
        --color-warning-v1: ${colors.warning_v1};
        --color-price-1: ${colors.price_color_1};
        --color-link: ${colors.link_color};
        --color-invalid-form: ${colors.invalid_form_color};
        --font-family-main: ${typography.font_family_main};
      }
    `.replace(/\s+/g, ' ').trim();

    let styleElement = this.document.getElementById('site-tenant-tokens') as HTMLStyleElement | null;
    if (!styleElement) {
      styleElement = this.document.createElement('style');
      styleElement.id = 'site-tenant-tokens';
      this.document.head.appendChild(styleElement);
    }
    styleElement.textContent = cssContent;

    if (isPlatformBrowser(this.platformId)) {
      this.businessApi.setBusiness(this.currentBusiness);
    }
  }

  // Para limpiar cache (útil en desarrollo)
  static clearCache(): void {
    this.domainCache.clear();
  }
}
