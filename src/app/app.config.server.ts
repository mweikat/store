import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { provideServerRouting } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';
import { TenantServerService } from './core/tenants/tenant.server.service';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes),
     TenantServerService
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
