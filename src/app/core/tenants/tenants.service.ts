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

  private readonly ENVIRONMENT = environment.production;
  private currentBusiness: BusinessModel | undefined = undefined;
  private static readonly domainCache = new Map<string, BusinessModel>();

  // BehaviorSubject para compartir globalmente
  private businessSubject = new BehaviorSubject<BusinessModel | null>(null);
  public business$: Observable<BusinessModel | null> = this.businessSubject.asObservable();

  // Referencia al listener de postMessage para evitar duplicados y permitir limpieza
  private messageListener: ((event: MessageEvent) => void) | null = null;

  constructor(
    private businessApi: BusinessService,
    private transferState: TransferState,
    @Inject(PLATFORM_ID) private platformId: any,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnDestroy(): void {
    this.stopThemePreviewListener();
  }

  private hasValidThemeConfig(business: BusinessModel | null | undefined): boolean {
    if (!business || !business.settings) return false;
    const theme = business.settings.theme_config?.theme || business.settings.theme;
    return !!(theme && theme.colors && Object.keys(theme.colors).length > 0);
  }

  private extractTheme(business: BusinessModel | null | undefined): any {
    if (!business || !business.settings) return null;
    return business.settings.theme_config?.theme || business.settings.theme || null;
  }

  private areThemesEqual(businessA: BusinessModel | null | undefined, businessB: BusinessModel | null | undefined): boolean {
    const themeA = this.extractTheme(businessA);
    const themeB = this.extractTheme(businessB);

    if (!themeA && !themeB) return true;
    if (!themeA || !themeB) return false;

    // Comparar objeto de colores serializado
    const colorsA = JSON.stringify(themeA.colors || {});
    const colorsB = JSON.stringify(themeB.colors || {});
    if (colorsA !== colorsB) return false;

    // Comparar objeto de tipografía serializado
    const typoA = JSON.stringify(themeA.typography || {});
    const typoB = JSON.stringify(themeB.typography || {});
    if (typoA !== typoB) return false;

    // Comparar objeto de ui serializado
    const uiA = JSON.stringify(themeA.ui || {});
    const uiB = JSON.stringify(themeB.ui || {});
    return uiA === uiB;
  }

  async initialize(): Promise<void> {

    const domain = await this.businessApi.getNameHost();

    // 1. Verificar cache en memoria primero
    const cached = TenantService.domainCache.get(domain);
    if (cached && this.hasValidThemeConfig(cached)) {
      this.currentBusiness = cached;
      this.businessSubject.next(cached);
      await this.loadBusinessStyles();
      this.setupThemePreviewListener();
      return;
    }

    // 2. Verificar TransferState (cuando el cliente hidrata desde SSR con datos frescos del servidor)
    if (isPlatformBrowser(this.platformId)) {
      const transferBusiness = this.transferState.get(TENANT_KEY, null);
      if (transferBusiness && transferBusiness.id && this.hasValidThemeConfig(transferBusiness)) {

        // Verificar si localStorage tiene un tema desactualizado en relación a TransferState
        const storedBusiness = this.businessApi.getBusinessStorage();
        if (!this.areThemesEqual(transferBusiness, storedBusiness)) {
          // Limpiar caché antigua de localStorage y refrescarla con los datos frescos de TransferState
          this.businessApi.setBusiness(transferBusiness);
        }

        this.currentBusiness = transferBusiness;
        TenantService.domainCache.set(domain, transferBusiness);
        this.businessSubject.next(transferBusiness);
        await this.loadBusinessStyles();
        this.setupThemePreviewListener();
        return;
      }

      // 3. Verificar localStorage si existe y coincide
      const storedBusiness = this.businessApi.getBusinessStorage();
      if (storedBusiness && storedBusiness.id && this.hasValidThemeConfig(storedBusiness)) {
        this.currentBusiness = storedBusiness;
        TenantService.domainCache.set(domain, storedBusiness);
        this.businessSubject.next(storedBusiness);
        await this.loadBusinessStyles();
        this.setupThemePreviewListener();
        return;
      }
    }

    try {
      // Llamar al API para obtener datos del business si no estaba en cache/TransferState o si la caché carecía de tema
      this.currentBusiness = await this.businessApi.getBusinessHost(domain).toPromise();
      
      if (!this.currentBusiness) {
        throw new Error(`No se encontró business para el dominio: ${domain}`);
      }

      if (isPlatformServer(this.platformId)) {
        this.transferState.set(TENANT_KEY, this.currentBusiness);
      }

      // Revalidar y actualizar localStorage con la respuesta fresca de la API
      if (isPlatformBrowser(this.platformId)) {
        const storedBusiness = this.businessApi.getBusinessStorage();
        if (!this.areThemesEqual(this.currentBusiness, storedBusiness)) {
          this.businessApi.setBusiness(this.currentBusiness);
        }
      }

      // Cachear el resultado
      TenantService.domainCache.set(domain, this.currentBusiness);
      this.businessSubject.next(this.currentBusiness);
      await this.loadBusinessStyles();
      
      if (isPlatformBrowser(this.platformId)) {
        this.setupThemePreviewListener();
      }

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

    // 3. Aplicar tema de previsualización temporal sin alterar el tenant ni la caché
    this.applyPreviewTheme(payload);
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
    const theme = previewPayload.theme_config?.theme || previewPayload.theme || previewPayload;
    const rawColors = theme?.colors || {};
    const rawTypography = theme?.typography || {};
    const rawUi = theme?.ui || {};

    const colors = this.sanitizeColors(rawColors);
    const typography = this.sanitizeTypography(rawTypography);
    const ui = this.sanitizeUi(rawUi);

    // Mapeo con los fallbacks existentes del servicio
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
      this.document.head.appendChild(styleElement);
    }
    styleElement.textContent = cssContent;
  }

  private async loadBusinessStyles(): Promise<void> {
    if (!this.currentBusiness) return;

    const theme = this.currentBusiness.settings?.theme_config?.theme || this.currentBusiness.settings?.theme;
    this.applyPreviewTheme(theme || {});

    if (isPlatformBrowser(this.platformId)) {
      this.businessApi.setBusiness(this.currentBusiness);
    }
  }

  // Para limpiar cache (útil en desarrollo)
  static clearCache(): void {
    this.domainCache.clear();
  }
}
