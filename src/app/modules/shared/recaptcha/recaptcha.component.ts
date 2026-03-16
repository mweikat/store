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
    styleUrl: './recaptcha.component.css',
    standalone: false
})
export class RecaptchaComponent implements OnInit, AfterViewInit, OnDestroy{

  @Output() token = new EventEmitter<string>();
  @Output() active = new EventEmitter<boolean>();


  destroyisRecaptcha?:Subscription;
  enable:boolean = true;

  //captcha vars
  errorOnRegister:any;
  CLAVE_RECAPTCHA = environment.recaptcha.siteKey;
  URL_RECAPTCHA = environment.url_recaptcha;
  captchaResponse: string | null = null; // Respuesta del reCAPTCHA
  captchaError: string | null = null;

  @ViewChild('googleQuoteRecapture', { static: false }) recaptchaElement!: ElementRef;
  private scriptId = 'recaptcha-script'; // ID único para el script

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private authService:AuthService){

    if(isPlatformBrowser(this.platformId)){
      this.authService.isRecaptcha();
    }
    
  }
  ngAfterViewInit(): void {

    if(isPlatformBrowser(this.platformId)){
      this.loadRecaptchaScript().then(() => {
        this.initializeRecaptcha();
      });
    }

  }

  ngOnDestroy(): void {

    if(this.destroyisRecaptcha)
      this.destroyisRecaptcha.unsubscribe();
    if(isPlatformBrowser(this.platformId))
      this.removeRecaptchaScript();

  }

  ngOnInit(): void {

    

    if(isPlatformBrowser(this.platformId)){
      this.destroyisRecaptcha = this.authService.recaptcha.subscribe(resp =>{
        
        if(!resp){
        
          this.enable = false;
          this.active.emit(this.enable);
        }else{
          (window as any).onCaptchaSuccess = this.onCaptchaSuccess.bind(this);
          (window as any).onCaptchaExpired = this.onCaptchaExpired.bind(this);
        }
     });
    }
    

    

  }



  private loadRecaptchaScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verifica si ya existe el script
      if (document.getElementById(this.scriptId)) {
        resolve(); // Script ya cargado
        return;
      }

      // Crea el script y lo agrega al DOM
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
    // Elimina el script al destruir el componente
    delete (window as any).onCaptchaSuccess;
    delete (window as any).onCaptchaExpired;
    const script = document.getElementById(this.scriptId);
    if (script) {
      script.remove();
    }
  }

  private onCaptchaSuccess(response: string) {
    this.captchaResponse = response;
    this.captchaError = null;
    this.token.emit(this.captchaResponse);
    
  }

  private onCaptchaExpired() {
    this.captchaResponse = null;
    this.captchaError ='Captcha expirado, intenta nuevamente.';
    this.resetCaptcha();
  }

  private resetCaptcha() {
    if (window.grecaptcha) {
      (window as any).grecaptcha.reset(); // Resetea el captcha globalmente
    }
  }

  private initializeRecaptcha(): void {
    const interval = setInterval(() => {
      if ((window as any).grecaptcha) {
        const grecaptcha = (window as any).grecaptcha;
        if (this.recaptchaElement?.nativeElement) {
          grecaptcha.render(this.recaptchaElement.nativeElement, {
            sitekey: this.CLAVE_RECAPTCHA, // Reemplaza con tu clave
            theme: 'light',
            callback: 'onCaptchaSuccess', // Nombre de la función global
            'expired-callback': 'onCaptchaExpired' // Nombre de la función global
          });
        }
        clearInterval(interval);
      }
    }, 100);
  }

}
