// src/app/core/tenants/tenants.service.ts
import { Injectable, Inject, PLATFORM_ID, DOCUMENT, TransferState, makeStateKey, OnDestroy } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { BusinessModel, BusinessThemeTypographyModel, BusinessThemeUIModel, BusinessThemeColorsModel } from '@models/business.model';
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
export class TenantService implements OnDestroy {

  public static clearCache(): void {
    // Helper mantenido para la suite de pruebas unitarias
  }

  private currentBusiness: BusinessModel | undefined = undefined;

  // BehaviorSubject para compartir globalmente
  private businessSubject = new BehaviorSubject<BusinessModel | null>(null);
  public business$: Observable<BusinessModel | null> = this.businessSubject.asObservable();

  // Referencia al listener de postMessage para evitar duplicados y permitir limpieza
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private pendingPreviewPayload: any = null;
  private previewAnimationFrameId: number | null = null;

  constructor(
    private businessApi: BusinessService,
    private transferState: TransferState,
    @Inject(PLATFORM_ID) private platformId: any,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnDestroy(): void {
    this.stopThemePreviewListener();
  }

  async initialize(): Promise<void> {

    const domain = await this.businessApi.getNameHost();

    if(isPlatformServer(this.platformId)) {

          try {
            // Llamar al API para obtener datos del business
            this.currentBusiness = await this.businessApi.getBusinessHost(domain).toPromise();
            
            if (!this.currentBusiness) {
              this.currentBusiness = this.getDefaultBusiness(domain);
            }

            // set transferState
            this.transferState.set(TENANT_KEY, this.currentBusiness);         

            this.businessSubject.next(this.currentBusiness);
            await this.loadBusinessStyles();        
            

          } catch (error) {
            console.error('❌ Error inicializando tenant en servidor:', error);
            this.currentBusiness = this.getDefaultBusiness(domain);
            this.transferState.set(TENANT_KEY, this.currentBusiness);
            this.businessSubject.next(this.currentBusiness);
            await this.loadBusinessStyles();
          }
    }else{

        // 1. Verificar TransferState (cuando el cliente hidrata desde SSR con datos frescos del servidor)
        const transferBusiness = this.transferState.get(TENANT_KEY, null);
        if(transferBusiness && transferBusiness.id){
          this.businessSubject.next(transferBusiness);
          this.currentBusiness = transferBusiness;
          if (typeof this.transferState?.remove === 'function') {
            this.transferState.remove(TENANT_KEY);
          }
          this.businessApi.setBusiness(transferBusiness);
          await this.loadBusinessStyles();
          this.setupThemePreviewListener();
          return;
        }

        // 2. Fallback local/API en navegador si no hay TransferState
        const storedBusiness = this.businessApi.getBusinessStorage();
        const storedTheme = this.extractTheme(storedBusiness);
        const hasStoredTheme = Object.keys(storedTheme).length > 0;

        if (storedBusiness && storedBusiness.id && hasStoredTheme) {
          this.currentBusiness = storedBusiness;
          this.businessSubject.next(storedBusiness);
          await this.loadBusinessStyles();
          this.setupThemePreviewListener();
        } else {
          try {
            this.currentBusiness = await this.businessApi.getBusinessHost(domain).toPromise();
            if (this.currentBusiness) {
              this.businessSubject.next(this.currentBusiness);
              this.businessApi.setBusiness(this.currentBusiness);
              await this.loadBusinessStyles();
              this.setupThemePreviewListener();
            } else {
              this.applyDefaultFallbackBusiness(domain);
            }
          } catch (error) {
            console.error('❌ Error fetching business host in browser:', error);
            this.applyDefaultFallbackBusiness(domain);
          }
        }
    }


  }

  private applyDefaultFallbackBusiness(domain: string): void {
    this.currentBusiness = this.getDefaultBusiness(domain);
    this.businessSubject.next(this.currentBusiness);
    this.loadBusinessStyles();
    this.setupThemePreviewListener();
  }

  private getDefaultBusiness(domain: string): BusinessModel {
    return {
      id: 'default-tenant',
      name: domain || 'Default Tenant',
      url: domain || 'localhost',
      desc: 'Default Fallback Tenant',
      info: {} as any,
      settings: {
        template_key: 'default',
        template_version: '1.0.0',
        theme_config: {
          theme: {
            colors: {},
            typography: { font_family_main: '"Montserrat", sans-serif' },
            ui: { card_radius: '8px', card_shadow: '0 2px 8px rgba(0,0,0,0.06)' }
          }
        }
      }
    };
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

  // Configura el listener de postMessage únicamente en entorno de navegador
  public setupThemePreviewListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.stopThemePreviewListener();

    this.messageListener = (event: MessageEvent) => {
      this.handleThemePreviewMessage(event);
    };

    window.addEventListener('message', this.messageListener);
  }

  // Remueve el listener de postMessage si existe
  public stopThemePreviewListener(): void {
    if (isPlatformBrowser(this.platformId) && this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
    if (this.previewAnimationFrameId !== null && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(this.previewAnimationFrameId);
      this.previewAnimationFrameId = null;
    }
    this.pendingPreviewPayload = null;
  }

  private handleThemePreviewMessage(event: MessageEvent): void {
    // 1. Validar origen strictly
    if (!this.isValidOrigin(event.origin)) {
      return;
    }

    // 2. Validar estructura básica del mensaje
    if (!event.data || typeof event.data !== 'object' || event.data.type !== 'THEME_UPDATE') {
      return;
    }

    const payload = event.data.payload;
    if (!payload || typeof payload !== 'object') {
      return;
    }

    // 3. Aplicar tema de previsualización con agrupación por frame en el navegador
    this.pendingPreviewPayload = payload;

    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      if (this.previewAnimationFrameId !== null) {
        window.cancelAnimationFrame(this.previewAnimationFrameId);
      }
      this.previewAnimationFrameId = window.requestAnimationFrame(() => {
        this.previewAnimationFrameId = null;
        if (this.pendingPreviewPayload) {
          const latestPayload = this.pendingPreviewPayload;
          this.pendingPreviewPayload = null;
          this.applyPreviewTheme(latestPayload);
        }
      });
    } else {
      this.applyPreviewTheme(payload);
    }
  }

  private isValidOrigin(origin: string): boolean {
    const rawAdminUrl = (environment as any).admin_url;
    if (!rawAdminUrl || typeof rawAdminUrl !== 'string') {
      return false;
    }

    try {
      const expectedUrl = new URL(rawAdminUrl);
      const expectedOrigin = expectedUrl.origin; // e.g. "http://localhost:4200"

      return origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  public applyPreviewTheme(previewPayload: any): void {
    const theme = this.extractTheme(previewPayload);
    const rawColors = theme?.colors || {};
    const rawTypography = theme?.typography || {};
    const rawUi = theme?.ui || {};

    const colors = this.sanitizeColors(rawColors);
    const typography = this.sanitizeTypography(rawTypography);
    const ui = this.sanitizeUi(rawUi);

    // Mapeo determinista con fallbacks de compatibilidad
    const primaryColor = colors.primary || '#917f6e';
    const primaryV1Color = colors.primary_v1 || colors.primary_dark || '#6d5742';
    const secondaryColor = colors.secondary || '#efbc98';
    const tertiaryColor = colors.tertiary || '#efd2be';
    const quaternaryColor = colors.quaternary || '#efe1d1';
    const quaternaryV2Color = colors.quaternary_v2 || colors.quaternary_light || '#ffedd9';
    const lightBgColor = colors.light_bg || colors.bg_light || '#ffffff';
    const darkTextColor = colors.dark_text || colors.text_dark || '#000000';
    const warningColor = colors.warning || '#ffbd59';
    const warningV1Color = colors.tertiary || 'rgba(253, 201, 13, 0.25)';
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
        /* Capa 1: Primitivos y Marca */
        --brand-primary: ${primaryColor};
        --brand-primary-dark: ${primaryV1Color};
        --brand-secondary: ${secondaryColor};
        --brand-tertiary: ${tertiaryColor};
        --brand-quaternary: ${quaternaryColor};
        --brand-quaternary-light: ${quaternaryV2Color};
        --neutral-100: ${lightBgColor};
        --neutral-900: ${darkTextColor};

        /* Capa 2: Tokens Semánticos y Funcionales */
        --color-surface-base: var(--neutral-100);
        --color-surface-variant: var(--brand-quaternary-light);
        --color-surface-subtle: var(--brand-quaternary);
        --color-text-base: var(--neutral-900);
        --color-text-dark: var(--neutral-900);
        --color-text-brand: var(--brand-primary);
        --color-text-sale: ${price2Color};
        --color-action-primary: var(--brand-primary);
        --color-action-primary-hover: var(--brand-primary-dark);
        --color-action-secondary: var(--brand-secondary);
        --color-border-default: var(--brand-tertiary);
        --color-border-subtle: var(--brand-quaternary);
        --color-state-warning: ${warningColor};
        --color-state-warning-soft: ${warningV1Color};
        --color-state-danger: ${invalidFormColor};
        --color-state-danger-text: ${checkFailColor};
        --color-link: ${linkColor};
        --color-card-list-total: ${cardListTotalColor};

        /* Capa 3: Tokens de Componentes con Fallback Semántico */
        --btn-primary-bg: var(--color-action-primary-hover);
        --btn-primary-border: var(--color-action-primary-hover);
        --btn-primary-text: var(--neutral-100);
        --btn-primary-hover-bg: var(--color-action-primary-hover);
        --card-border-color: var(--color-border-default);
        --card-bg: var(--color-surface-base);
        --input-focus-ring: var(--color-state-warning-soft);
        --product-price-sale: ${price2Color};

        /* Product Card Component Tokens */
        --product-card-bg: var(--color-surface-base);
        --product-card-border: var(--color-border-default);
        --product-card-img-bg: var(--color-surface-subtle);
        --product-card-img-border: var(--color-border-default);
        --product-card-title: var(--color-action-primary-hover);
        --product-card-price: var(--color-action-primary-hover);
        --product-card-price-sale: ${price2Color};

        /* Header Component Tokens */
        --header-bg: var(--color-surface-base);
        --header-border: var(--color-border-default);
        --header-link: var(--color-action-primary-hover);
        --header-link-hover: var(--color-action-primary-hover);
        --header-dropdown-bg: var(--color-surface-base);
        --header-dropdown-text: var(--color-text-dark);
        --header-dropdown-hover-bg: var(--color-state-warning-soft);
        --header-sidebar-bg: var(--color-surface-base);
        --header-sidebar-header-bg: var(--color-border-default);
        --header-sidebar-title: var(--color-action-primary);
        --header-sidebar-overlay: ${rgba4};

        /* Footer Component Tokens */
        --footer-bg: var(--neutral-900);
        --footer-text: var(--neutral-100);
        --footer-link: var(--color-action-primary);
        --footer-link-hover: var(--color-action-primary-hover);

        /* Cart Component Tokens */
        --cart-title: var(--color-action-primary);
        --cart-item-bg: ${rgba2};
        --cart-item-title: var(--color-action-primary);
        --cart-item-price: var(--color-action-primary-hover);
        --cart-quantity-btn: var(--color-action-primary);
        --cart-quantity-btn-hover-bg: var(--color-action-secondary);
        --cart-summary-bg: ${cardListTotalColor};
        --cart-summary-title: var(--color-action-primary);
        --cart-summary-btn-bg: var(--color-action-primary);
        --cart-menu-toggle: var(--color-action-primary);
        --cart-menu-badge-bg: ${warningColor};
        --cart-menu-badge-text: var(--neutral-100);
        --cart-menu-dropdown-bg: var(--color-surface-base);
        --cart-menu-dropdown-border: var(--color-border-default);
        --cart-menu-btn-bg: var(--color-action-secondary);
        --cart-menu-btn-text: var(--neutral-100);

        /* Checkout Component Tokens */
        --checkout-title: var(--color-action-primary);
        --checkout-section-border: ${quaternaryColor};
        --checkout-confirm-card-bg: var(--color-surface-base);
        --checkout-confirm-title: var(--color-action-primary);
        --checkout-confirm-order-bg: ${tertiaryColor};
        --checkout-fail-card-bg: var(--color-surface-base);
        --checkout-fail-title: ${checkFailColor};
        --checkout-fail-order-bg: ${tertiaryColor};
        --checkout-steps-bg: ${quaternaryColor};
        --checkout-steps-active-bg: var(--color-action-primary);
        --checkout-steps-active-text: var(--neutral-100);

        /* User Menu & User Admin Tokens */
        --user-menu-icon: var(--color-action-primary);
        --user-menu-btn-bg: var(--color-action-secondary);
        --user-menu-btn-text: var(--neutral-100);
        --user-menu-dropdown-bg: var(--color-surface-base);
        --user-menu-dropdown-border: var(--color-border-default);
        --user-menu-dropdown-text: var(--color-text-dark);
        --user-admin-menu-text: var(--color-action-primary);
        --user-admin-menu-border: var(--color-surface-base);
        --user-admin-menu-hover-bg: var(--color-action-secondary);
        --user-admin-menu-hover-text: var(--neutral-100);
        --user-admin-menu-active-bg: var(--color-action-primary);
        --user-admin-menu-active-text: var(--neutral-100);
        --user-orders-title: var(--color-action-primary);
        --user-orders-badge-success-bg: var(--color-action-secondary);
        --user-orders-badge-success-text: var(--neutral-900);
        --user-orders-badge-warning-bg: ${warningColor};
        --user-orders-badge-warning-text: var(--color-action-primary-hover);
        --user-orders-badge-danger-bg: ${price1Color};
        --user-orders-badge-danger-text: var(--neutral-900);

        /* Pagination Component Tokens */
        --pagination-bg: var(--color-surface-base);
        --pagination-text: var(--color-action-primary);
        --pagination-border: ${quaternaryV2Color};
        --pagination-active-bg: var(--color-action-primary-hover);
        --pagination-active-text: var(--neutral-100);
        --pagination-hover-bg: var(--color-state-warning-soft);
        --pagination-hover-text: var(--color-action-primary-hover);

        /* Remapeo Bootstrap 5 */
        --bs-primary: var(--color-action-primary);
        --bs-body-bg: var(--color-surface-base);
        --bs-body-color: var(--color-text-base);
        --bs-link-color: var(--color-link);

        /* Variables CSS Heredadas (Compatibilidad Histórica Completa) */
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

        /* Tipografía y Propiedades UI */
        --font-family-main: ${typography.font_family_main};
        --card-radius: ${ui.card_radius};
        --card-shadow: ${ui.card_shadow};
      }
    `.replace(/\s+/g, ' ').trim();

    this.updateStyleElement(cssContent);
  }

  private sanitizeColors(rawColors: any): BusinessThemeColorsModel {
    const sanitized: BusinessThemeColorsModel = {};
    if (!rawColors || typeof rawColors !== 'object') return sanitized;

    for (const [key, value] of Object.entries(rawColors)) {
      if (typeof value === 'string' && this.isValidColorValue(value.trim())) {
        (sanitized as any)[key] = value.trim();
      }
    }
    return sanitized;
  }

  private isValidColorValue(val: string): boolean {
    if (!val) return false;
    // Prevenir inyección de CSS (no permitir ;, {, }, <, >, url, javascript)
    if (/[;{}<>]|url\s*\(|javascript\s*:/i.test(val)) {
      return false;
    }

    // Hex (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
    const hexRegex = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    if (hexRegex.test(val)) return true;

    // RGB / RGBA
    const rgbRegex = /^rgba?\(\s*(\d{1,3}%?\s*,\s*){2}\d{1,3}%?\s*(,\s*(0|1|0?\.\d+|\d{1,3}%)\s*)?\)$/i;
    if (rgbRegex.test(val)) return true;

    // HSL / HSLA
    const hslRegex = /^hsla?\(\s*\d{1,3}(deg)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*(0|1|0?\.\d+|\d{1,3}%)\s*)?\)$/i;
    if (hslRegex.test(val)) return true;

    return false;
  }

  private sanitizeTypography(rawTypo: any): { font_family_main: string } {
    if (!rawTypo || typeof rawTypo !== 'object') {
      return { ...DEFAULT_TYPOGRAPHY };
    }

    const val = rawTypo.font_family_main || rawTypo.fontFamily;
    if (typeof val === 'string' && this.isValidFontFamily(val.trim())) {
      return { font_family_main: val.trim() };
    }

    return { ...DEFAULT_TYPOGRAPHY };
  }

  private isValidFontFamily(val: string): boolean {
    if (!val) return false;
    if (/[;{}<>]|url\s*\(|javascript\s*:/i.test(val)) return false;
    // Permite letras, números, espacios, guiones, comas, comillas simples y dobles
    return /^[a-zA-Z0-9\s,\-"']+$/.test(val);
  }

  private sanitizeUi(rawUi: any): Required<BusinessThemeUIModel> {
    const result = { ...DEFAULT_UI };
    if (!rawUi || typeof rawUi !== 'object') return result;

    const radius = rawUi.card_radius || rawUi.borderRadius;
    if (typeof radius === 'string' && this.isValidDimension(radius.trim())) {
      result.card_radius = radius.trim();
    }

    const shadow = rawUi.card_shadow || rawUi.boxShadow;
    if (typeof shadow === 'string' && this.isValidShadow(shadow.trim())) {
      result.card_shadow = shadow.trim();
    }

    return result;
  }

  private isValidDimension(val: string): boolean {
    if (!val) return false;
    if (/[;{}<>]|url\s*\(|javascript\s*:/i.test(val)) return false;
    return /^\d+(px|rem|em|%)?$/.test(val);
  }

  private isValidShadow(val: string): boolean {
    if (!val) return false;
    if (/[;{}<>]|url\s*\(|javascript\s*:/i.test(val)) return false;
    return /^(none|0|(\d+(px|rem|em)\s*){2,4}(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|[a-zA-Z]+)?)$/i.test(val);
  }

  private updateStyleElement(cssContent: string): void {
    let styleElement = this.document.getElementById('site-tenant-tokens') as HTMLStyleElement | null;
    if (!styleElement) {
      styleElement = this.document.createElement('style');
      styleElement.id = 'site-tenant-tokens';
      styleElement.textContent = cssContent;
      this.document.head.appendChild(styleElement);
      return;
    }

    if (styleElement.textContent === cssContent) {
      return;
    }

    styleElement.textContent = cssContent;
  }

  private extractTheme(input: BusinessModel | BusinessSettingsModel | BusinessThemeModel | Record<string, any> | null | undefined): BusinessThemeModel {
    if (!input || typeof input !== 'object') {
      return {};
    }

    const rawInput = input as Record<string, any>;
    const settings = (rawInput['settings'] && typeof rawInput['settings'] === 'object') ? rawInput['settings'] : rawInput;
    const themeConfigTheme = settings.theme_config?.theme;
    const directTheme = settings.theme || (rawInput !== settings ? rawInput['theme'] : undefined);

    const hasThemeContent = (t: any): boolean => {
      if (!t || typeof t !== 'object') return false;
      const hasColors = t.colors && typeof t.colors === 'object' && Object.keys(t.colors).length > 0;
      const hasTypo = t.typography && typeof t.typography === 'object' && Object.keys(t.typography).length > 0;
      const hasUi = t.ui && typeof t.ui === 'object' && Object.keys(t.ui).length > 0;
      return hasColors || hasTypo || hasUi;
    };

    if (hasThemeContent(themeConfigTheme)) {
      return themeConfigTheme;
    }
    if (hasThemeContent(directTheme)) {
      return directTheme;
    }
    if (themeConfigTheme && typeof themeConfigTheme === 'object') {
      return themeConfigTheme;
    }
    if (directTheme && typeof directTheme === 'object') {
      return directTheme;
    }
    if (hasThemeContent(rawInput) && !rawInput['settings'] && !rawInput['id'] && !rawInput['template_key']) {
      return rawInput as BusinessThemeModel;
    }

    return {};
  }

  private async loadBusinessStyles(): Promise<void> {
    if (!this.currentBusiness) return;

    const theme = this.extractTheme(this.currentBusiness);
    this.applyPreviewTheme(theme);
  }

}
