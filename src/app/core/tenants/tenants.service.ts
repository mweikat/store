// src/app/core/tenants/tenants.service.ts
import { Injectable, Inject, PLATFORM_ID, DOCUMENT, TransferState, makeStateKey } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { BusinessModel, BusinessThemeTypographyModel, BusinessThemeUIModel } from '@models/business.model';
import { BusinessService } from '@services/business.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const TENANT_KEY = makeStateKey<BusinessModel>('tenant_business');

const DEFAULT_TYPOGRAPHY: Required<BusinessThemeTypographyModel> = {
  font_family_main: '"Montserrat", sans-serif'
};

const DEFAULT_UI: Required<BusinessThemeUIModel> = {
  card_radius: '8px',
  card_shadow: '0 2px 8px rgba(0,0,0,0.06)'
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
    if (cached && cached.settings) {
      this.currentBusiness = cached;
      this.businessSubject.next(cached);
      await this.loadBusinessStyles();
      return;
    }

    // 2. Verificar TransferState (cuando el cliente hidrata desde SSR)
    if (isPlatformBrowser(this.platformId)) {
      const transferBusiness = this.transferState.get(TENANT_KEY, null);
      if (transferBusiness && transferBusiness.id && transferBusiness.settings) {
        this.currentBusiness = transferBusiness;
        TenantService.domainCache.set(domain, transferBusiness);
        this.businessSubject.next(transferBusiness);
        await this.loadBusinessStyles();
        return;
      }

      // 3. Verificar localStorage si existe y tiene settings
      const storedBusiness = this.businessApi.getBusinessStorage();
      if (storedBusiness && storedBusiness.id && storedBusiness.settings) {
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

    const theme = this.currentBusiness.settings?.theme_config?.theme || this.currentBusiness.settings?.theme;
    const colors = theme?.colors || {};
    const typography = { ...DEFAULT_TYPOGRAPHY, ...theme?.typography };
    const ui = { ...DEFAULT_UI, ...theme?.ui };

    const primaryColor = colors.primary || '#917f6e';
    const primaryV1Color = colors.primary_v1 || colors.primary_dark || '#6d5742';
    const secondaryColor = colors.secondary || '#efbc98';
    const tertiaryColor = colors.tertiary || '#efd2be';
    const quaternaryColor = colors.quaternary || '#efe1d1';
    const quaternaryV2Color = colors.quaternary_v2 || colors.quaternary_light || '#ffedd9';
    const lightBgColor = colors.light_bg || colors.bg_light || '#ffffff';
    const darkTextColor = colors.dark_text || colors.text_dark || '#000000';
    const warningColor = colors.warning || '#ffbd59';
    const warningV1Color = colors.warning_v1 || 'rgba(253, 201, 13, 0.25)';
    const price1Color = colors.price_1 || colors.price_color_1 || colors.price_sale || '#e74c3c';
    const price2Color = colors.price_2 || '#dc3545';
    const linkColor = colors.link || colors.link_color || '#efbc98';
    const invalidFormColor = colors.invalid_form || colors.invalid_form_color || '#ff0000';
    const checkFailColor = colors.check_fail || '#d9534f';
    const cardListTotalColor = colors.card_list_total || '#fff3cd';
    const rgba1 = colors.rgba_1 || 'rgba(253, 201, 13, 0.5)';
    const rgba2 = colors.rgba_2 || 'rgba(253, 201, 13, 0.5)';
    const rgba3 = colors.rgba_3 || 'rgba(255, 189, 89, 0.11)';
    const rgba4 = colors.rgba_4 || 'rgba(0, 0, 0, 0.5)';

    const cssContent = `
      :root {
        --color-primary: ${primaryColor};
        --color-primary-v1: ${primaryV1Color};
        --color-secondary: ${secondaryColor};
        --color-tertiary: ${tertiaryColor};
        --color-quaternary: ${quaternaryColor};
        --color-quaternary-v2: ${quaternaryV2Color};
        --color-light-bg: ${lightBgColor};
        --color-dark-text: ${darkTextColor};
        --color-warning: ${warningColor};
        --color-warning-v1: ${warningV1Color};
        --color-price-1: ${price1Color};
        --color-price-2: ${price2Color};
        --color-link: ${linkColor};
        --color-invalid-form: ${invalidFormColor};
        --color-check-fail: ${checkFailColor};
        --color-card-list-total: ${cardListTotalColor};
        --color-rgba-1: ${rgba1};
        --color-rgba-2: ${rgba2};
        --color-rgba-3: ${rgba3};
        --color-rgba-4: ${rgba4};
        --font-family-main: ${typography.font_family_main};
        --card-radius: ${ui.card_radius};
        --card-shadow: ${ui.card_shadow};
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
