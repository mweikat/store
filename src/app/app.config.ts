import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay, withIncrementalHydration } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { TokenInterceptor } from '@interceptor/token.interceptor';
import { GenericInterceptor } from '@interceptor/generic.interceptor';
import { TenantInterceptor } from './core/tenants/tenant.interceptor';
import { TenantService } from './core/tenants/tenants.service';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';

// Factory function para APP_INITIALIZER
export function initializeTenant(tenantService: TenantService) {
  return (): Promise<void> => {
    return tenantService.initialize();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes,withInMemoryScrolling({
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled',
    })), 
    provideClientHydration(withIncrementalHydration(), withEventReplay()),
    provideHttpClient(withInterceptorsFromDi(),withFetch()),
      {
        provide: APP_INITIALIZER,
        useFactory: initializeTenant,
        deps: [TenantService],
        multi: true
      },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: TokenInterceptor,
        multi: true
      },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: GenericInterceptor,
        multi: true
      },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: TenantInterceptor,
        multi: true
      },
      {
        provide: IMAGE_LOADER,
        useValue: (config: ImageLoaderConfig) => config.src
      } 
  ]
};
