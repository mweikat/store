import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay, withIncrementalHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from '@interceptor/token.interceptor';
import { genericInterceptor } from '@interceptor/generic.interceptor';
import { tenantInterceptor } from './core/tenants/tenant.interceptor';
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
    provideHttpClient(
      withFetch(),
      withInterceptors([tokenInterceptor, genericInterceptor, tenantInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTenant,
      deps: [TenantService],
      multi: true
    },
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => config.src
    }
  ]
};
