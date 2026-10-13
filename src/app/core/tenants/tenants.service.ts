// src/app/core/tenants/tenants.service.ts
import { Injectable, Inject, PLATFORM_ID, DOCUMENT, TransferState, makeStateKey } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { BusinessModel, BusinessThemeColorsModel, BusinessThemeTypographyModel, BusinessThemeUIModel } from '@models/business.model';
import { BusinessService } from '@services/business.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const TENANT_KEY = makeStateKey<BusinessModel>('tenant_business');

const DEFAULT_COLORS: Required<BusinessThemeColorsModel> = {
  primary: '#917f6e',
  primary_v1: '#6d5742',
  primary_dark: '#6d5742',
  secondary: '#efbc98',
  tertiary: '#efd2be',
  quaternary: '#efe1d1',
  quaternary_v2: '#ffedd9',
  quaternary_light: '#ffedd9',
  light_bg: '#ffffff',
  bg_light: '#ffffff',
  dark_text: '#000000',
  text_dark: '#000000',
  warning: '#ffbd59',
  warning_v1: 'rgba(253, 201, 13, 0.25)',
  price_1: '#e74c3c',
  price_2: '#dc3545',
  price_color_1: '#e74c3c',
  price_sale: '#e74c3c',
  link: '#efbc98',
  link_color: '#efbc98',
  invalid_form: '#ff0000',
  invalid_form_color: 'red',
  check_fail: '#d9534f',
  card_list_total: '#fff3cd',
  rgba_1: 'rgba(253, 201, 13, 0.5)',
  rgba_2: 'rgba(253, 201, 13, 0.5)',
  rgba_3: 'rgba(255, 189, 89, 0.11)',
  rgba_4: 'rgba(0, 0, 0, 0.5)'
};

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

    const theme = this.currentBusiness.settings?.theme_config?.theme || this.currentBusiness.settings?.theme;
    const colors = { ...DEFAULT_COLORS, ...theme?.colors };
    const typography = { ...DEFAULT_TYPOGRAPHY, ...theme?.typography };
    const ui = { ...DEFAULT_UI, ...theme?.ui };

    const primaryColor = colors.primary || DEFAULT_COLORS.primary;
    const primaryV1Color = colors.primary_v1 || colors.primary_dark || DEFAULT_COLORS.primary_v1;
    const secondaryColor = colors.secondary || DEFAULT_COLORS.secondary;
    const tertiaryColor = colors.tertiary || DEFAULT_COLORS.tertiary;
    const quaternaryColor = colors.quaternary || DEFAULT_COLORS.quaternary;
    const quaternaryV2Color = colors.quaternary_v2 || colors.quaternary_light || DEFAULT_COLORS.quaternary_v2;
    const lightBgColor = colors.light_bg || colors.bg_light || DEFAULT_COLORS.light_bg;
    const darkTextColor = colors.dark_text || colors.text_dark || DEFAULT_COLORS.dark_text;
    const warningColor = colors.warning || DEFAULT_COLORS.warning;
    const warningV1Color = colors.warning_v1 || DEFAULT_COLORS.warning_v1;
    const price1Color = colors.price_1 || colors.price_color_1 || colors.price_sale || DEFAULT_COLORS.price_1;
    const linkColor = colors.link || colors.link_color || DEFAULT_COLORS.link;
    const invalidFormColor = colors.invalid_form || colors.invalid_form_color || DEFAULT_COLORS.invalid_form;

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
        --color-price-2: ${colors.price_2};
        --color-link: ${linkColor};
        --color-invalid-form: ${invalidFormColor};
        --color-check-fail: ${colors.check_fail};
        --color-card-list-total: ${colors.card_list_total};
        --color-rgba-1: ${colors.rgba_1};
        --color-rgba-2: ${colors.rgba_2};
        --color-rgba-3: ${colors.rgba_3};
        --color-rgba-4: ${colors.rgba_4};
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
