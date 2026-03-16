import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutauthComponent } from './layoutauth/layoutauth.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthRoutingModule } from './auth-routing.module';
import { ForgotComponent } from './pages/forgot/forgot.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ResettPasswordComponent } from './pages/resett-password/resett-password.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { SharedModule } from '@modules/shared/shared.module';

// google login
import { SocialLoginModule, SocialAuthServiceConfig, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { GoogleLoginProvider } from '@abacritt/angularx-social-login';
import { environment } from 'src/environments/environment';

@NgModule({
  declarations: [
    LayoutauthComponent,
    LoginComponent,
    RegisterComponent,
    ForgotComponent,
    ResettPasswordComponent,
    VerifyEmailComponent,
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule,
    SharedModule,
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
export class AuthModule { }
