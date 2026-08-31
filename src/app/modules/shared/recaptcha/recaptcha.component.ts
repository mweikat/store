import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, OnDestroy, OnInit, Output, PLATFORM_ID, ViewChild } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

declare global {
  interface Window {
    grecaptcha: any;
  }
}
export {};

@Component({
    selector: 'app-recaptcha',
    templateUrl: './recaptcha.component.html',
    styleUrl: './recaptcha.component.scss',
    standalone: false
})
export class RecaptchaComponent implements OnInit, AfterViewInit, OnDestroy {

  @Output() token = new EventEmitter<string>();
  @Output() active = new EventEmitter<boolean>();

  destroyisRecaptcha?: Subscription;
  enable: boolean = true;

  //captcha vars
  errorOnRegister: any;
  CLAVE_RECAPTCHA = null;
  URL_RECAPTCHA = environment.url_recaptcha;
  captchaResponse: string | null = null;
  captchaError: string | null = null;

  @ViewChild('googleQuoteRecapture', { static: false }) recaptchaElement!: ElementRef;
  private scriptId = 'recaptcha-script';
  private widgetId: number | null = null; // <-- Almacena el ID del widget
  private isRendered = false; // <-- Controla si ya se renderizó

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private authService: AuthService) {
    if (isPlatformBrowser(this.platformId)) {
      this.authService.isRecaptcha();
      this.loadRecaptchaScript();
    }
  }

  ngAfterViewInit(): void {
    // No es necesario cargar el script aquí
  }

  ngOnDestroy(): void {
    if (this.destroyisRecaptcha) {
      this.destroyisRecaptcha.unsubscribe();
    }
    
    if (isPlatformBrowser(this.platformId)) {
      // Resetear y limpiar el widget antes de destruir
      this.resetAndDestroyCaptcha();
      this.removeRecaptchaScript();
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.destroyisRecaptcha = this.authService.recaptcha.subscribe(resp => {
        //console.log('resp ', resp);
        if (!resp.isActive) {
          this.enable = false;
          this.active.emit(this.enable);
          //console.log('enable 1', this.enable);
        }

        if (resp.isActive) {
          this.enable = true;
          this.CLAVE_RECAPTCHA = resp.client_key;
          // Esperar a que el elemento esté disponible
          setTimeout(() => {
            this.initializeRecaptcha();
          }, 100);
          //console.log('enable 2', this.enable, this.CLAVE_RECAPTCHA);
        }
      });
    }
  }

  private loadRecaptchaScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById(this.scriptId)) {
        //console.log('ya cargado');
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = this.URL_RECAPTCHA;
      script.id = this.scriptId;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject('Error al cargar el script de reCAPTCHA');
      document.body.appendChild(script);
    });
  }

  private removeRecaptchaScript(): void {
    delete (window as any).onCaptchaSuccess;
    delete (window as any).onCaptchaExpired;
    
    // Limpiar el widget antes de eliminar el script
    this.resetAndDestroyCaptcha();
    
    const script = document.getElementById(this.scriptId);
    if (script) {
      script.remove();
    }
  }

  private resetAndDestroyCaptcha(): void {
    if (window.grecaptcha && this.widgetId !== null) {
      try {
        // Resetear el widget
        window.grecaptcha.reset(this.widgetId);
        // Destruir el widget
        window.grecaptcha.reset(this.widgetId);
        this.widgetId = null;
        this.isRendered = false;
        
        // Limpiar el contenido del elemento
        if (this.recaptchaElement?.nativeElement) {
          this.recaptchaElement.nativeElement.innerHTML = '';
        }
      } catch (error) {
        console.error('Error al limpiar recaptcha:', error);
      }
    }
  }

  private onCaptchaSuccess(response: string) {
    this.captchaResponse = response;
    this.captchaError = null;
    this.token.emit(this.captchaResponse);
  }

  private onCaptchaExpired() {
    this.captchaResponse = null;
    this.captchaError = 'Captcha expirado, intenta nuevamente.';
    this.resetCaptcha();
  }

  private resetCaptcha() {
    if (window.grecaptcha && this.widgetId !== null) {
      window.grecaptcha.reset(this.widgetId);
    }
  }

  private initializeRecaptcha(): void {
    // Verificar si el elemento existe y no está ya renderizado
    if (!this.recaptchaElement?.nativeElement) {
      console.warn('Elemento recaptcha no disponible');
      return;
    }

    // Verificar si ya está renderizado
    if (this.isRendered) {
      console.warn('reCAPTCHA ya está renderizado');
      return;
    }

    // Verificar si el elemento ya tiene contenido (ya renderizado)
    if (this.recaptchaElement.nativeElement.innerHTML.trim() !== '') {
      console.warn('El elemento ya tiene contenido, limpiando...');
      this.recaptchaElement.nativeElement.innerHTML = '';
    }

    const interval = setInterval(() => {
      if ((window as any).grecaptcha) {
        try {
          const grecaptcha = (window as any).grecaptcha;
          
          // Configurar funciones globales
          (window as any).onCaptchaSuccess = this.onCaptchaSuccess.bind(this);
          (window as any).onCaptchaExpired = this.onCaptchaExpired.bind(this);

          // Renderizar el widget y guardar el ID
          this.widgetId = grecaptcha.render(this.recaptchaElement.nativeElement, {
            sitekey: this.CLAVE_RECAPTCHA,
            theme: 'light',
            callback: 'onCaptchaSuccess',
            'expired-callback': 'onCaptchaExpired'
          });
          
          this.isRendered = true;
          clearInterval(interval);
          
        } catch (error) {
          console.error('Error al renderizar reCAPTCHA:', error);
          clearInterval(interval);
        }
      }
    }, 500);
  }

  // Método público para resetear manualmente si es necesario
  public resetCaptchaManually(): void {
    this.resetAndDestroyCaptcha();
    this.isRendered = false;
    setTimeout(() => {
      this.initializeRecaptcha();
    }, 100);
  }
}