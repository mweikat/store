import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CartRoutingModule } from './cart-routing.module';
import { CartLayoutComponent } from './cart-layout/cart-layout.component';
import { SharedModule } from '@modules/shared/shared.module';
import { CartListComponent } from './components/cart-list/cart-list.component';
import { FastRegisterComponent } from './components/fast-register/fast-register.component';
import { ReactiveFormsModule } from '@angular/forms';

// google login
import { SocialLoginModule, SocialAuthServiceConfig, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { GoogleLoginProvider } from '@abacritt/angularx-social-login';
import { environment } from 'src/environments/environment';




@NgModule({
  declarations: [
    CartLayoutComponent,
    CartListComponent,
    FastRegisterComponent
  ],
  imports: [
    CommonModule,
    CartRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    SocialLoginModule,
    GoogleSigninButtonModule
  ],
    providers: [
      {
        provide: 'SocialAuthServiceConfig',
        useValue: {
          autoLogin: false,
          providers: [
            {
              id: GoogleLoginProvider.PROVIDER_ID,
              provider: new GoogleLoginProvider(
                environment.googleClientIdlogin, // Reemplaza con tu Client ID
                {
                  oneTapEnabled: false, // Opcional: deshabilita el one-tap
                  scopes: 'email profile' // Scopes que necesites
                }
              )
            }
          ],
          onError: (err) => {
            console.error(err);
          }
        } as SocialAuthServiceConfig,
      }
    ]
})
export class CartModule { }
