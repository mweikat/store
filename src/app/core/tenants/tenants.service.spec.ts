import { TestBed } from '@angular/core/testing';
import { TenantService } from './tenants.service';
import { BusinessService } from '@services/business.service';
import { PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { of } from 'rxjs';
import { BusinessModel } from '@models/business.model';

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

    mockTransferState = jasmine.createSpyObj('TransferState', ['get', 'set']);
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
    const styleEl = document.getElementById('site-tenant-tokens');
    if (styleEl) {
      styleEl.remove();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('A. Tema canónico', () => {
    it('should load canonical theme colors, typography, and ui settings', async () => {
      await service.initialize();

      const styleEl = document.getElementById('site-tenant-tokens');
      expect(styleEl).toBeTruthy();
      const cssText = styleEl?.textContent || '';

      expect(cssText).toContain('--color-primary: #112233');
      expect(cssText).toContain('--color-secondary: #445566');
      expect(cssText).toContain('--color-tertiary: #778899');
      expect(cssText).toContain('--color-quaternary: #AABBCC');
      expect(cssText).toContain('--font-family-main: "Roboto", sans-serif');
      expect(cssText).toContain('--card-radius: 12px');
      expect(cssText).toContain('--card-shadow: 0 4px 12px rgba(0,0,0,0.1)');
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

  describe('C. Configuración ausente', () => {
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
    it('should isolate theme data per domain in domainCache', async () => {
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

      // Re-initialization of tenant-a should hit domainCache
      mockBusinessService.getNameHost.and.returnValue('tenant-a');
      await service.initialize();
      expect(service.getBusinessId()).toBe('tenant-a-id');
      const styleEl = document.getElementById('site-tenant-tokens');
      expect(styleEl?.textContent).toContain('--color-primary: #111111');
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
});
