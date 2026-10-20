import { TestBed } from '@angular/core/testing';
import { TenantService } from './tenants.service';
import { BusinessService } from '@services/business.service';
import { PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { of } from 'rxjs';
import { BusinessModel } from '@models/business.model';
import { environment } from 'src/environments/environment';

const TENANT_KEY = makeStateKey<BusinessModel>('tenant_business');

describe('TenantService', () => {
  let service: TenantService;
  let mockBusinessService: jasmine.SpyObj<BusinessService>;
  let mockTransferState: jasmine.SpyObj<TransferState>;
  let document: Document;

  const mockBusinessCanonical: BusinessModel = {
    id: 'bus-100',
    name: 'Canonical Pet Shop',
    url: 'canonical.cl',
    desc: 'Canonical Description',
    info: {} as any,
    settings: {
      template_key: 'default',
      template_version: '1.0.0',
      theme_config: {
        theme: {
          colors: {
            primary: '#112233',
            secondary: '#445566',
            tertiary: '#778899',
            quaternary: '#AABBCC',
            light_bg: '#FFFFFF',
            dark_text: '#111111'
          },
          typography: {
            font_family_main: '"Roboto", sans-serif'
          },
          ui: {
            card_radius: '12px',
            card_shadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }
      }
    }
  };

  const mockBusinessAliasTheme: BusinessModel = {
    id: 'bus-200',
    name: 'Alias Pet Shop',
    url: 'alias.cl',
    desc: 'Alias Description',
    info: {} as any,
    settings: {
      template_key: 'default',
      template_version: '1.0.0',
      theme: {
        colors: {
          primary: '#990000',
          secondary: '#009900'
        }
      }
    }
  };

  beforeEach(() => {
    TenantService.clearCache();

    const styleEl = window.document.getElementById('site-tenant-tokens');
    if (styleEl) {
      styleEl.remove();
    }

    mockBusinessService = jasmine.createSpyObj('BusinessService', [
      'getNameHost',
      'getBusinessHost',
      'getBusinessStorage',
      'setBusiness'
    ]);
    mockBusinessService.getNameHost.and.returnValue('testdomain');
    mockBusinessService.getBusinessHost.and.returnValue(of(mockBusinessCanonical));
    mockBusinessService.getBusinessStorage.and.returnValue({} as BusinessModel);

    mockTransferState = jasmine.createSpyObj('TransferState', ['get', 'set', 'remove']);
    mockTransferState.get.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        TenantService,
        { provide: BusinessService, useValue: mockBusinessService },
        { provide: TransferState, useValue: mockTransferState },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: window.document }
      ]
    });

    service = TestBed.inject(TenantService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    TenantService.clearCache();
    service.stopThemePreviewListener();
    const styleEl = document.getElementById('site-tenant-tokens');
    if (styleEl) {
      styleEl.remove();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('A. Tema canónico', () => {
    it('should load canonical theme colors, typography, and ui settings along with 3-tier tokens', async () => {
      await service.initialize();

      const styleEl = document.getElementById('site-tenant-tokens');
      expect(styleEl).toBeTruthy();
      const cssText = styleEl?.textContent || '';

      // Primitivos / Marca
      expect(cssText).toContain('--brand-primary: #112233');
      expect(cssText).toContain('--brand-secondary: #445566');
      // Tokens Semánticos
      expect(cssText).toContain('--color-action-primary: var(--brand-primary)');
      expect(cssText).toContain('--color-surface-base: var(--neutral-100)');
      // Tokens de Componentes (Fase 3A)
      expect(cssText).toContain('--btn-primary-bg: var(--color-action-primary-hover)');
      expect(cssText).toContain('--product-card-bg: var(--color-surface-base)');
      expect(cssText).toContain('--product-card-border: var(--color-border-default)');
      expect(cssText).toContain('--product-card-title: var(--color-action-primary-hover)');
      expect(cssText).toContain('--header-bg: var(--color-surface-base)');
      expect(cssText).toContain('--header-link: var(--color-action-primary-hover)');
      expect(cssText).toContain('--footer-bg: var(--neutral-900)');
      expect(cssText).toContain('--footer-text: var(--neutral-100)');
      // Tokens de Carrito, Checkout, User Admin y Paginación (Fases 3B.1, 3B.2, 3B.3, 4.4)
      expect(cssText).toContain('--cart-title: var(--color-action-primary)');
      expect(cssText).toContain('--cart-item-title: var(--color-action-primary)');
      expect(cssText).toContain('--cart-item-price: var(--color-action-primary-hover)');
      expect(cssText).toContain('--checkout-title: var(--color-action-primary)');
      expect(cssText).toContain('--checkout-steps-active-bg: var(--color-action-primary)');
      expect(cssText).toContain('--user-menu-icon: var(--color-action-primary)');
      expect(cssText).toContain('--user-orders-title: var(--color-action-primary)');
      expect(cssText).toContain('--user-orders-badge-success-text: var(--neutral-900)');
      expect(cssText).toContain('--pagination-active-bg: var(--color-action-primary-hover)');
      // Remapeo Bootstrap 5
      expect(cssText).toContain('--bs-primary: var(--color-action-primary)');
      // Tokens Heredados
      expect(cssText).toContain('--color-primary: #112233');
      expect(cssText).toContain('--color-secondary: #445566');
      expect(cssText).toContain('--color-tertiary: #778899');
      expect(cssText).toContain('--color-quaternary: #AABBCC');
      expect(cssText).toContain('--font-family-main: "Roboto", sans-serif');
      expect(cssText).toContain('--card-radius: 12px');
    });
  });

  describe('B. Alias de compatibilidad (settings.theme)', () => {
    it('should fallback to settings.theme when theme_config is absent', async () => {
      mockBusinessService.getBusinessHost.and.returnValue(of(mockBusinessAliasTheme));

      await service.initialize();

      const styleEl = document.getElementById('site-tenant-tokens');
      const cssText = styleEl?.textContent || '';

      expect(cssText).toContain('--color-primary: #990000');
      expect(cssText).toContain('--color-secondary: #009900');
    });
  });

  describe('C. Configuración ausente o incompleta en caché', () => {
    it('should apply default theme values when settings is missing/empty without throwing errors', async () => {
      const mockBusinessNoSettings: BusinessModel = {
        id: 'bus-300',
        name: 'Empty Settings Store',
        url: 'empty.cl',
        desc: 'No settings',
        info: {} as any
      };
      mockBusinessService.getBusinessHost.and.returnValue(of(mockBusinessNoSettings));

      await service.initialize();

      const styleEl = document.getElementById('site-tenant-tokens');
      const cssText = styleEl?.textContent || '';

      expect(cssText).toContain('--color-primary: #917f6e');
      expect(cssText).toContain('--color-secondary: #efbc98');
      expect(cssText).toContain('--color-tertiary: #efd2be');
      expect(cssText).toContain('--color-quaternary: #efe1d1');
      expect(cssText).toContain('--font-family-main: "Montserrat", sans-serif');
      expect(cssText).toContain('--card-radius: 8px');
    });

    it('should bypass incomplete storedBusiness in localStorage that lacks a theme and fetch full theme from getBusinessHost', async () => {
      const incompleteStoredBusiness: BusinessModel = {
        id: 'bus-301',
        name: 'Incomplete LocalStorage Store',
        url: 'incomplete.cl',
        desc: 'Has settings but no theme',
        info: {} as any,
        settings: {
          template_key: 'default',
          template_version: '1.0.0'
        }
      };

      mockBusinessService.getBusinessStorage.and.returnValue(incompleteStoredBusiness);
      mockBusinessService.getBusinessHost.and.returnValue(of(mockBusinessCanonical));

      await service.initialize();

      expect(mockBusinessService.getBusinessHost).toHaveBeenCalled();
      const styleEl = document.getElementById('site-tenant-tokens');
      const cssText = styleEl?.textContent || '';
      expect(cssText).toContain('--color-primary: #112233');
    });

    it('should detect when localStorage has an outdated theme compared to TransferState and overwrite localStorage with the fresh theme', async () => {
      const staleStoredBusiness: BusinessModel = {
        ...mockBusinessCanonical,
        settings: {
          theme_config: {
            theme: {
              colors: { primary: '#000000' }
            }
          }
        }
      };

      const freshTransferBusiness: BusinessModel = {
        ...mockBusinessCanonical,
        settings: {
          theme_config: {
            theme: {
              colors: { primary: '#11EE22' }
            }
          }
        }
      };

      mockTransferState.get.and.returnValue(freshTransferBusiness);
      mockBusinessService.getBusinessStorage.and.returnValue(staleStoredBusiness);

      await service.initialize();

      expect(mockBusinessService.setBusiness).toHaveBeenCalledWith(freshTransferBusiness);
      const styleEl = document.getElementById('site-tenant-tokens');
      const cssText = styleEl?.textContent || '';
      expect(cssText).toContain('--color-primary: #11EE22');
    });

    it('should fetch fresh theme from getBusinessHost when localStorage lacks theme and update localStorage', async () => {
      const freshApiBusiness: BusinessModel = {
        ...mockBusinessCanonical,
        settings: {
          theme_config: {
            theme: {
              colors: { primary: '#123456' }
            }
          }
        }
      };

      mockBusinessService.getBusinessStorage.and.returnValue({} as BusinessModel);
      mockBusinessService.getBusinessHost.and.returnValue(of(freshApiBusiness));

      await service.initialize();

      expect(mockBusinessService.setBusiness).toHaveBeenCalledWith(freshApiBusiness);
      const styleEl = document.getElementById('site-tenant-tokens');
      const cssText = styleEl?.textContent || '';
      expect(cssText).toContain('--color-primary: #123456');
    });
  });

  describe('D. Configuración parcial', () => {
    it('should keep provided custom properties and fill missing properties with default fallbacks', async () => {
      const mockPartialBusiness: BusinessModel = {
        id: 'bus-400',
        name: 'Partial Store',
        url: 'partial.cl',
        desc: 'Partial',
        info: {} as any,
        settings: {
          theme_config: {
            theme: {
              colors: {
                primary: '#123456'
              }
            }
          }
        }
      };
      mockBusinessService.getBusinessHost.and.returnValue(of(mockPartialBusiness));

      await service.initialize();

      const styleEl = document.getElementById('site-tenant-tokens');
      const cssText = styleEl?.textContent || '';

      expect(cssText).toContain('--color-primary: #123456');
      expect(cssText).toContain('--color-secondary: #efbc98');
      expect(cssText).toContain('--font-family-main: "Montserrat", sans-serif');
    });
  });

  describe('E. Compatibilidad con claves históricas y prioridad', () => {
    it('should respect priority order for primary_v1 over primary_dark', async () => {
      const mockLegacyPriority: BusinessModel = {
        id: 'bus-500',
        name: 'Legacy Priority Store',
        url: 'legacy.cl',
        desc: 'Legacy',
        info: {} as any,
        settings: {
          theme: {
            colors: {
              primary_v1: '#AAAAAA',
              primary_dark: '#BBBBBB',
              quaternary_v2: '#CCCCCC',
              quaternary_light: '#DDDDDD',
              light_bg: '#EEEEEE',
              bg_light: '#111111',
              dark_text: '#222222',
              text_dark: '#333333',
              price_1: '#444444',
              price_color_1: '#555555',
              price_sale: '#666666'
            }
          }
        }
      };
      mockBusinessService.getBusinessHost.and.returnValue(of(mockLegacyPriority));

      await service.initialize();

      const styleEl = document.getElementById('site-tenant-tokens');
      const cssText = styleEl?.textContent || '';

      expect(cssText).toContain('--color-primary-v1: #AAAAAA');
      expect(cssText).toContain('--color-quaternary-v2: #CCCCCC');
      expect(cssText).toContain('--color-light-bg: #EEEEEE');
      expect(cssText).toContain('--color-dark-text: #222222');
      expect(cssText).toContain('--color-price-1: #444444');
    });

    it('should use fallback keys when primary_v1, quaternary_v2, light_bg, dark_text, price_1 are missing', async () => {
      const mockLegacyFallback: BusinessModel = {
        id: 'bus-501',
        name: 'Legacy Fallback Store',
        url: 'legacy2.cl',
        desc: 'Legacy 2',
        info: {} as any,
        settings: {
          theme: {
            colors: {
              primary_dark: '#BBBBBB',
              quaternary_light: '#DDDDDD',
              bg_light: '#111111',
              text_dark: '#333333',
              price_color_1: '#555555'
            }
          }
        }
      };
      mockBusinessService.getBusinessHost.and.returnValue(of(mockLegacyFallback));

      await service.initialize();

      const styleEl = document.getElementById('site-tenant-tokens');
      const cssText = styleEl?.textContent || '';

      expect(cssText).toContain('--color-primary-v1: #BBBBBB');
      expect(cssText).toContain('--color-quaternary-v2: #DDDDDD');
      expect(cssText).toContain('--color-light-bg: #111111');
      expect(cssText).toContain('--color-dark-text: #333333');
      expect(cssText).toContain('--color-price-1: #555555');
    });
  });

  describe('F. Actualización del elemento de estilos', () => {
    it('should update existing site-tenant-tokens element without creating duplicate tags', async () => {
      await service.initialize();
      let styleTags = document.querySelectorAll('#site-tenant-tokens');
      expect(styleTags.length).toBe(1);

      mockBusinessService.getNameHost.and.returnValue('seconddomain');
      const secondBusiness: BusinessModel = {
        ...mockBusinessCanonical,
        id: 'bus-600',
        settings: {
          theme_config: {
            theme: {
              colors: { primary: '#FF00FF' }
            }
          }
        }
      };
      mockBusinessService.getBusinessHost.and.returnValue(of(secondBusiness));

      await service.initialize();
      styleTags = document.querySelectorAll('#site-tenant-tokens');
      expect(styleTags.length).toBe(1);
      expect(styleTags[0].textContent).toContain('--color-primary: #FF00FF');
    });
  });

  describe('G. Aislamiento entre tenants', () => {
    it('should isolate theme data per domain across calls', async () => {
      mockBusinessService.getNameHost.and.returnValue('tenant-a');
      const tenantA: BusinessModel = {
        ...mockBusinessCanonical,
        id: 'tenant-a-id',
        settings: {
          theme_config: {
            theme: {
              colors: { primary: '#111111' }
            }
          }
        }
      };
      mockBusinessService.getBusinessHost.and.returnValue(of(tenantA));

      await service.initialize();
      expect(service.getBusinessId()).toBe('tenant-a-id');
      let styleEl = document.getElementById('site-tenant-tokens');
      expect(styleEl?.textContent).toContain('--color-primary: #111111');

      mockBusinessService.getNameHost.and.returnValue('tenant-b');
      const tenantB: BusinessModel = {
        ...mockBusinessCanonical,
        id: 'tenant-b-id',
        settings: {
          theme_config: {
            theme: {
              colors: { primary: '#222222' }
            }
          }
        }
      };
      mockBusinessService.getBusinessHost.and.returnValue(of(tenantB));

      await service.initialize();
      expect(service.getBusinessId()).toBe('tenant-b-id');
      styleEl = document.getElementById('site-tenant-tokens');
      expect(styleEl?.textContent).toContain('--color-primary: #222222');
    });
  });

  describe('TransferState', () => {
    it('should load business from TransferState in browser platform when available', async () => {
      const transferBusiness: BusinessModel = {
        id: 'transfer-id',
        name: 'Transfer Store',
        url: 'transfer.cl',
        desc: 'Transfer',
        info: {} as any,
        settings: {
          theme_config: {
            theme: {
              colors: { primary: '#333333' }
            }
          }
        }
      };
      mockTransferState.get.and.returnValue(transferBusiness);

      await service.initialize();

      expect(service.getBusinessId()).toBe('transfer-id');
      expect(mockBusinessService.getBusinessHost).not.toHaveBeenCalled();
      const styleEl = document.getElementById('site-tenant-tokens');
      expect(styleEl?.textContent).toContain('--color-primary: #333333');
    });
  });

  describe('Fase 4C: postMessage Theme Preview', () => {
    const authorizedOrigin = 'http://localhost:4200';

    beforeEach(async () => {
      (environment as any).admin_url = authorizedOrigin;
      await service.initialize();
    });

    it('1. should accept a valid THEME_UPDATE message from an authorized origin', () => {
      const validMessage = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: {
          type: 'THEME_UPDATE',
          payload: {
            theme_config: {
              theme: {
                colors: { primary: '#123456' },
                typography: { font_family_main: '"Open Sans", sans-serif' },
                ui: { card_radius: '16px' }
              }
            }
          }
        }
      });

      window.dispatchEvent(validMessage);

      const styleEl = document.getElementById('site-tenant-tokens');
      const cssText = styleEl?.textContent || '';
      expect(cssText).toContain('--color-primary: #123456');
      expect(cssText).toContain('--font-family-main: "Open Sans", sans-serif');
      expect(cssText).toContain('--card-radius: 16px');
    });

    it('2. should reject a message from an unauthorized origin', () => {
      const styleElBefore = document.getElementById('site-tenant-tokens')?.textContent;

      const unauthorizedMessage = new MessageEvent('message', {
        origin: 'http://evil-site.com',
        data: {
          type: 'THEME_UPDATE',
          payload: { colors: { primary: '#FF0000' } }
        }
      });

      window.dispatchEvent(unauthorizedMessage);

      const styleElAfter = document.getElementById('site-tenant-tokens')?.textContent;
      expect(styleElAfter).toBe(styleElBefore);
      expect(styleElAfter).not.toContain('--color-primary: #FF0000');
    });

    it('3. should reject similar domains, unauthorized subdomains, or scheme/port mismatches', () => {
      const styleElBefore = document.getElementById('site-tenant-tokens')?.textContent;

      const testCases = [
        'http://localhost:4200.evil.com',
        'http://evil.localhost:4200',
        'https://localhost:4200',
        'http://localhost:8080'
      ];

      for (const badOrigin of testCases) {
        window.dispatchEvent(new MessageEvent('message', {
          origin: badOrigin,
          data: {
            type: 'THEME_UPDATE',
            payload: { colors: { primary: '#999999' } }
          }
        }));
      }

      const styleElAfter = document.getElementById('site-tenant-tokens')?.textContent;
      expect(styleElAfter).toBe(styleElBefore);
      expect(styleElAfter).not.toContain('--color-primary: #999999');
    });

    it('4. should reject messages with wrong event type or malformed payload', () => {
      const styleElBefore = document.getElementById('site-tenant-tokens')?.textContent;

      const badMessages = [
        { type: 'OTHER_EVENT', payload: { colors: { primary: '#00FF00' } } },
        { type: 'THEME_UPDATE', payload: null },
        { type: 'THEME_UPDATE', payload: 'string-payload' },
        null
      ];

      for (const badData of badMessages) {
        window.dispatchEvent(new MessageEvent('message', {
          origin: authorizedOrigin,
          data: badData
        }));
      }

      const styleElAfter = document.getElementById('site-tenant-tokens')?.textContent;
      expect(styleElAfter).toBe(styleElBefore);
      expect(styleElAfter).not.toContain('--color-primary: #00FF00');
    });

    it('5. should accept valid 3, 4, 6, and 8 digit Hex colors, rgb/a, and hsl/a', () => {
      const validColorsMsg = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: {
          type: 'THEME_UPDATE',
          payload: {
            colors: {
              primary: '#FFF',
              secondary: '#123F',
              tertiary: '#FFFFFF',
              quaternary: '#123456FF',
              price_1: 'rgb(255, 0, 0)',
              price_2: 'rgba(255, 0, 0, 0.5)',
              warning: 'hsl(120, 100%, 50%)',
              link: 'hsla(120, 100%, 50%, 0.3)'
            }
          }
        }
      });

      window.dispatchEvent(validColorsMsg);

      const styleEl = document.getElementById('site-tenant-tokens');
      const cssText = styleEl?.textContent || '';
      expect(cssText).toContain('--color-primary: #FFF');
      expect(cssText).toContain('--color-secondary: #123F');
      expect(cssText).toContain('--color-tertiary: #FFFFFF');
      expect(cssText).toContain('--color-quaternary: #123456FF');
      expect(cssText).toContain('--color-price-1: rgb(255, 0, 0)');
      expect(cssText).toContain('--color-price-2: rgba(255, 0, 0, 0.5)');
      expect(cssText).toContain('--color-warning: hsl(120, 100%, 50%)');
      expect(cssText).toContain('--color-link: hsla(120, 100%, 50%, 0.3)');
    });

    it('6. should reject invalid or incomplete hex strings (#1, #12, #12345, #1234567)', () => {
      const invalidHexMsg = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: {
          type: 'THEME_UPDATE',
          payload: {
            colors: {
              primary: '#1',
              secondary: '#12',
              tertiary: '#12345',
              quaternary: '#1234567'
            }
          }
        }
      });

      window.dispatchEvent(invalidHexMsg);

      const styleEl = document.getElementById('site-tenant-tokens');
      const cssText = styleEl?.textContent || '';
      expect(cssText).toContain('--color-primary: #917f6e');
      expect(cssText).toContain('--color-secondary: #efbc98');
      expect(cssText).toContain('--color-tertiary: #efd2be');
      expect(cssText).toContain('--color-quaternary: #efe1d1');
    });

    it('7. should reject values trying to inject CSS rules via expression(), url(), ;, }, or javascript:', () => {
      const maliciousMessage = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: {
          type: 'THEME_UPDATE',
          payload: {
            colors: {
              primary: '#FFFFFF; body { display: none !important; }',
              secondary: 'expression(alert(1))',
              tertiary: 'url(javascript:alert(1))',
              quaternary: 'red; } </style><script>alert(1)</script>'
            }
          }
        }
      });

      window.dispatchEvent(maliciousMessage);

      const styleEl = document.getElementById('site-tenant-tokens');
      const cssText = styleEl?.textContent || '';
      expect(cssText).not.toContain('display: none');
      expect(cssText).not.toContain('expression');
      expect(cssText).not.toContain('script');
      expect(cssText).toContain('--color-primary: #917f6e');
      expect(cssText).toContain('--color-secondary: #efbc98');
    });

    it('8. should support partial theme updates without resetting existing valid variables', () => {
      // 1. Initial valid theme
      window.dispatchEvent(new MessageEvent('message', {
        origin: authorizedOrigin,
        data: {
          type: 'THEME_UPDATE',
          payload: {
            colors: { primary: '#111111', secondary: '#222222' },
            typography: { font_family_main: '"Open Sans", sans-serif' }
          }
        }
      }));

      let cssText = document.getElementById('site-tenant-tokens')?.textContent || '';
      expect(cssText).toContain('--color-primary: #111111');
      expect(cssText).toContain('--color-secondary: #222222');
      expect(cssText).toContain('--font-family-main: "Open Sans", sans-serif');

      // 2. Partial update containing only typography
      window.dispatchEvent(new MessageEvent('message', {
        origin: authorizedOrigin,
        data: {
          type: 'THEME_UPDATE',
          payload: {
            typography: { font_family_main: '"Roboto", sans-serif' }
          }
        }
      }));

      cssText = document.getElementById('site-tenant-tokens')?.textContent || '';
      expect(cssText).toContain('--font-family-main: "Roboto", sans-serif');
      // Unspecified primary in second message falls back gracefully without breaking
      expect(cssText).toContain('--color-primary: #917f6e');
    });

    it('9. should validate and sanitize typography, card radius, and box shadow when received', () => {
      const validCustomsMessage = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: {
          type: 'THEME_UPDATE',
          payload: {
            typography: { font_family_main: '"Poppins", sans-serif' },
            ui: { card_radius: '10px', card_shadow: 'none' }
          }
        }
      });

      window.dispatchEvent(validCustomsMessage);

      let cssText = document.getElementById('site-tenant-tokens')?.textContent || '';
      expect(cssText).toContain('--font-family-main: "Poppins", sans-serif');
      expect(cssText).toContain('--card-radius: 10px');
      expect(cssText).toContain('--card-shadow: none');

      // Malicious typography & ui values
      const maliciousUiMessage = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: {
          type: 'THEME_UPDATE',
          payload: {
            typography: { font_family_main: 'Arial; body{color:red}' },
            ui: { card_radius: '10px; background:red', card_shadow: 'url(javascript:alert(1))' }
          }
        }
      });

      window.dispatchEvent(maliciousUiMessage);

      cssText = document.getElementById('site-tenant-tokens')?.textContent || '';
      expect(cssText).toContain('--font-family-main: "Montserrat", sans-serif');
      expect(cssText).toContain('--card-radius: 8px');
      expect(cssText).toContain('--card-shadow: 0 2px 8px rgba(0,0,0,0.06)');
    });

    it('10. should update existing site-tenant-tokens element in-place without duplicating style tags', () => {
      const msg1 = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#111111' } } }
      });
      const msg2 = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#222222' } } }
      });

      window.dispatchEvent(msg1);
      window.dispatchEvent(msg2);

      const styleTags = document.querySelectorAll('#site-tenant-tokens');
      expect(styleTags.length).toBe(1);
      expect(styleTags[0].textContent).toContain('--color-primary: #222222');
    });

    it('11. should ensure invalid messages do not alter existing styles', () => {
      const msgValid = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#123456' } } }
      });
      window.dispatchEvent(msgValid);

      let cssText = document.getElementById('site-tenant-tokens')?.textContent || '';
      expect(cssText).toContain('--color-primary: #123456');

      const msgInvalid = new MessageEvent('message', {
        origin: 'http://evil.com',
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#FFFFFF' } } }
      });
      window.dispatchEvent(msgInvalid);

      cssText = document.getElementById('site-tenant-tokens')?.textContent || '';
      expect(cssText).toContain('--color-primary: #123456');
    });

    it('12. should ensure preview does not mutate currentBusiness or domainCache', () => {
      const originalBusiness = service.getCurrentBusiness();
      const originalPrimary = originalBusiness.settings?.theme_config?.theme?.colors?.primary;

      const previewMsg = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#999999' } } }
      });
      window.dispatchEvent(previewMsg);

      const businessAfter = service.getCurrentBusiness();
      expect(businessAfter.settings?.theme_config?.theme?.colors?.primary).toBe(originalPrimary);
    });

    it('13. should not write preview updates to localStorage or trigger HTTP persist calls', async () => {
      mockBusinessService.getBusinessHost.calls.reset();
      const localStorageSpy = spyOn(localStorage, 'setItem');

      const previewMsg = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#ABCDEF' } } }
      });
      window.dispatchEvent(previewMsg);

      expect(localStorageSpy).not.toHaveBeenCalled();
      expect(mockBusinessService.getBusinessHost).not.toHaveBeenCalled();
    });

    it('14. should not register listener during SSR execution', () => {
      const addEventListenerSpy = spyOn(window, 'addEventListener');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          TenantService,
          { provide: BusinessService, useValue: mockBusinessService },
          { provide: TransferState, useValue: mockTransferState },
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: DOCUMENT, useValue: window.document }
        ]
      });

      const ssrTenantService = TestBed.inject(TenantService);
      ssrTenantService.setupThemePreviewListener();

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('15. should clean up listener properly and avoid duplicate event listeners', () => {
      service.stopThemePreviewListener();
      const removeEventListenerSpy = spyOn(window, 'removeEventListener').and.callThrough();

      service.setupThemePreviewListener();
      service.setupThemePreviewListener();

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);

      service.stopThemePreviewListener();
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Fase 1: Optimización del Inyector CSS', () => {
    it('1. should create style#site-tenant-tokens when element does not exist', () => {
      const existing = document.getElementById('site-tenant-tokens');
      if (existing) existing.remove();

      service.applyPreviewTheme({ colors: { primary: '#111111' } });

      const el = document.getElementById('site-tenant-tokens');
      expect(el).toBeTruthy();
      expect(el?.textContent).toContain('--brand-primary: #111111');
    });

    it('2. should NOT rewrite textContent if CSS content is identical on subsequent calls', () => {
      service.applyPreviewTheme({ colors: { primary: '#222222' } });

      const el = document.getElementById('site-tenant-tokens') as HTMLStyleElement;
      expect(el).toBeTruthy();

      const textContentSetterSpy = spyOnProperty(el, 'textContent', 'set').and.callThrough();

      service.applyPreviewTheme({ colors: { primary: '#222222' } });

      expect(textContentSetterSpy).not.toHaveBeenCalled();
    });

    it('3. should update textContent if CSS content is different', () => {
      service.applyPreviewTheme({ colors: { primary: '#333333' } });

      const el = document.getElementById('site-tenant-tokens') as HTMLStyleElement;
      expect(el.textContent).toContain('--brand-primary: #333333');

      service.applyPreviewTheme({ colors: { primary: '#444444' } });

      expect(el.textContent).toContain('--brand-primary: #444444');
    });

    it('4. should avoid rewriting when style element with expected CSS pre-exists before initialization (SSR hydration)', async () => {
      const existing = document.getElementById('site-tenant-tokens');
      if (existing) existing.remove();

      // Simulate pre-existing SSR rendered style tag
      service.applyPreviewTheme(mockBusinessCanonical.settings?.theme_config?.theme || {});
      const el = document.getElementById('site-tenant-tokens') as HTMLStyleElement;
      expect(el).toBeTruthy();

      const textContentSetterSpy = spyOnProperty(el, 'textContent', 'set').and.callThrough();

      // Initialize service simulating client hydration
      await service.initialize();

      expect(textContentSetterSpy).not.toHaveBeenCalled();
    });

    it('5. should recover and recreate style element if element is removed from DOM externally', () => {
      service.applyPreviewTheme({ colors: { primary: '#555555' } });

      let el = document.getElementById('site-tenant-tokens');
      expect(el).toBeTruthy();
      el?.remove();

      expect(document.getElementById('site-tenant-tokens')).toBeNull();

      service.applyPreviewTheme({ colors: { primary: '#555555' } });

      el = document.getElementById('site-tenant-tokens');
      expect(el).toBeTruthy();
      expect(el?.textContent).toContain('--brand-primary: #555555');
    });

    it('6. should restore expected CSS if element content is modified externally', () => {
      service.applyPreviewTheme({ colors: { primary: '#666666' } });

      const el = document.getElementById('site-tenant-tokens') as HTMLStyleElement;
      el.textContent = '/* corrupted styles */';

      service.applyPreviewTheme({ colors: { primary: '#666666' } });

      expect(el.textContent).toContain('--brand-primary: #666666');
    });

    it('7. should correctly update between two different valid theme configurations', () => {
      service.applyPreviewTheme(mockBusinessCanonical.settings?.theme_config?.theme || {});
      let el = document.getElementById('site-tenant-tokens');
      expect(el?.textContent).toContain('--brand-primary: #112233');

      service.applyPreviewTheme(mockBusinessAliasTheme.settings?.theme || {});
      el = document.getElementById('site-tenant-tokens');
      expect(el?.textContent).toContain('--brand-primary: #990000');
    });

    it('8. should preserve default fallbacks and token mappings without changes', () => {
      service.applyPreviewTheme({});
      const el = document.getElementById('site-tenant-tokens');
      expect(el?.textContent).toContain('--brand-primary: #917f6e');
      expect(el?.textContent).toContain('--font-family-main: "Montserrat", sans-serif');
      expect(el?.textContent).toContain('--card-radius: 8px');
    });
  });

  describe('Fase 2: Normalización del Payload de Temas', () => {
    it('1. should extract theme from theme_config.theme structure', () => {
      const payload = {
        settings: {
          theme_config: {
            theme: { colors: { primary: '#A1B2C3' } }
          }
        }
      };
      service.applyPreviewTheme(payload);
      const el = document.getElementById('site-tenant-tokens');
      expect(el?.textContent).toContain('--brand-primary: #A1B2C3');
    });

    it('2. should extract theme from direct theme structure (alias)', () => {
      const payload = {
        settings: {
          theme: { colors: { primary: '#C3B2A1' } }
        }
      };
      service.applyPreviewTheme(payload);
      const el = document.getElementById('site-tenant-tokens');
      expect(el?.textContent).toContain('--brand-primary: #C3B2A1');
    });

    it('3. should verify canonical theme_config.theme precedence when both structures are present with non-empty colors', () => {
      const payload = {
        settings: {
          theme_config: {
            theme: { colors: { primary: '#111111' } }
          },
          theme: { colors: { primary: '#222222' } }
        }
      };
      service.applyPreviewTheme(payload);
      const el = document.getElementById('site-tenant-tokens');
      expect(el?.textContent).toContain('--brand-primary: #111111');
    });

    it('4. should fallback to direct theme when theme_config.theme is an empty object', () => {
      const payload = {
        settings: {
          theme_config: { theme: {} },
          theme: { colors: { primary: '#333333' } }
        }
      };
      service.applyPreviewTheme(payload);
      const el = document.getElementById('site-tenant-tokens');
      expect(el?.textContent).toContain('--brand-primary: #333333');
    });

    it('5. should safely handle payload without theme or null/undefined settings', () => {
      service.applyPreviewTheme({ settings: null });
      const el = document.getElementById('site-tenant-tokens');
      expect(el?.textContent).toContain('--brand-primary: #917f6e');

      service.applyPreviewTheme(null);
      expect(el?.textContent).toContain('--brand-primary: #917f6e');
    });

    it('6. should handle incomplete theme objects cleanly with default fallbacks', () => {
      const payload = {
        theme: {
          colors: { primary: '#777777' },
          typography: null,
          ui: undefined
        }
      };
      service.applyPreviewTheme(payload);
      const el = document.getElementById('site-tenant-tokens');
      expect(el?.textContent).toContain('--brand-primary: #777777');
      expect(el?.textContent).toContain('--font-family-main: "Montserrat", sans-serif');
      expect(el?.textContent).toContain('--card-radius: 8px');
    });

    it('7. should apply preview theme without altering existing behavior or Phase 1 DOM write optimizations', () => {
      const previewPayload = {
        theme_config: {
          theme: { colors: { primary: '#888888' } }
        }
      };
      service.applyPreviewTheme(previewPayload);
      const el = document.getElementById('site-tenant-tokens') as HTMLStyleElement;
      expect(el?.textContent).toContain('--brand-primary: #888888');

      const textContentSetterSpy = spyOnProperty(el, 'textContent', 'set').and.callThrough();
      service.applyPreviewTheme(previewPayload);
      expect(textContentSetterSpy).not.toHaveBeenCalled();
    });

    it('8. should verify canonical theme takes precedence without deep merging when canonical has colors but lacks typography/ui while alias has them', () => {
      const payload = {
        settings: {
          theme_config: {
            theme: { colors: { primary: '#112233' } }
          },
          theme: {
            colors: { primary: '#998877' },
            typography: { font_family_main: '"CustomFont", sans-serif' },
            ui: { card_radius: '20px' }
          }
        }
      };
      service.applyPreviewTheme(payload);
      const el = document.getElementById('site-tenant-tokens');
      expect(el?.textContent).toContain('--brand-primary: #112233');
      // No deep merge: canonical theme is selected, typography/ui fall back to system defaults
      expect(el?.textContent).toContain('--font-family-main: "Montserrat", sans-serif');
      expect(el?.textContent).toContain('--card-radius: 8px');
    });

    it('9. should NOT interpret a BusinessModel object without a valid theme as a theme object', () => {
      const businessObjectWithoutTheme: BusinessModel = {
        id: 'bus-300',
        name: 'No Theme Pet Shop',
        url: 'notheme.cl',
        desc: 'No Theme Description',
        info: {} as any,
        settings: {}
      };

      service.applyPreviewTheme(businessObjectWithoutTheme);
      const el = document.getElementById('site-tenant-tokens');
      expect(el?.textContent).toContain('--brand-primary: #917f6e');
      expect(el?.textContent).toContain('--font-family-main: "Montserrat", sans-serif');
    });
  });

  describe('Fase 3: Optimización Controlada de la Vista Previa de Temas', () => {
    let authorizedOrigin: string;

    beforeEach(() => {
      authorizedOrigin = new URL((environment as any).admin_url).origin;
      service.setupThemePreviewListener();
    });

    it('1. should process a valid message and apply preview theme', (done) => {
      const msg = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#112233' } } }
      });

      window.dispatchEvent(msg);

      requestAnimationFrame(() => {
        const el = document.getElementById('site-tenant-tokens');
        expect(el?.textContent).toContain('--brand-primary: #112233');
        done();
      });
    });

    it('2. should coalesce rapid consecutive messages A, B, C into a single frame execution applying C', (done) => {
      const msgA = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#AAAAAA' } } }
      });
      const msgB = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#BBBBBB' } } }
      });
      const msgC = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#CCCCCC' } } }
      });

      const applySpy = spyOn(service, 'applyPreviewTheme').and.callThrough();

      window.dispatchEvent(msgA);
      window.dispatchEvent(msgB);
      window.dispatchEvent(msgC);

      requestAnimationFrame(() => {
        expect(applySpy).toHaveBeenCalledTimes(1);
        expect(applySpy).toHaveBeenCalledWith({ colors: { primary: '#CCCCCC' } });

        const el = document.getElementById('site-tenant-tokens');
        expect(el?.textContent).toContain('--brand-primary: #CCCCCC');
        done();
      });
    });

    it('3. should ignore messages with unauthorized origin or invalid format', () => {
      const invalidOriginMsg = new MessageEvent('message', {
        origin: 'http://unauthorized.com',
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#999999' } } }
      });
      const invalidDataMsg = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: { type: 'OTHER_TYPE', payload: { colors: { primary: '#999999' } } }
      });

      window.dispatchEvent(invalidOriginMsg);
      window.dispatchEvent(invalidDataMsg);

      const el = document.getElementById('site-tenant-tokens');
      expect(el?.textContent).not.toContain('--brand-primary: #999999');
    });

    it('4. should not generate redundant DOM writes when consecutive preview themes are identical', (done) => {
      const msg1 = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#444444' } } }
      });
      const msg2 = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#444444' } } }
      });

      window.dispatchEvent(msg1);

      requestAnimationFrame(() => {
        const el = document.getElementById('site-tenant-tokens') as HTMLStyleElement;
        expect(el?.textContent).toContain('--brand-primary: #444444');

        const textContentSetterSpy = spyOnProperty(el, 'textContent', 'set').and.callThrough();

        window.dispatchEvent(msg2);

        requestAnimationFrame(() => {
          expect(textContentSetterSpy).not.toHaveBeenCalled();
          done();
        });
      });
    });

    it('5. should cancel pending animation frame callbacks on stopThemePreviewListener or service destruction', (done) => {
      const cancelSpy = spyOn(window, 'cancelAnimationFrame').and.callThrough();

      const msg = new MessageEvent('message', {
        origin: authorizedOrigin,
        data: { type: 'THEME_UPDATE', payload: { colors: { primary: '#777777' } } }
      });

      window.dispatchEvent(msg);

      service.stopThemePreviewListener();

      expect(cancelSpy).toHaveBeenCalled();

      requestAnimationFrame(() => {
        const el = document.getElementById('site-tenant-tokens');
        expect(el?.textContent).not.toContain('--brand-primary: #777777');
        done();
      });
    });
  });
});
