import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@services/auth.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-forgot',
    templateUrl: './forgot.component.html',
    styleUrl: './forgot.component.scss',
    standalone: false
})
export class ForgotComponent{

 
  errorText:string='';
  errorDiv:boolean=false;

  //captcha vars
  captchaResponse: string | null = null; // Respuesta del reCAPTCHA
  isEnableRecaptcha:boolean = true;

  formEmail = new FormGroup({
    email: new FormControl('',[Validators.required,Validators.email,Validators.maxLength(150)]),
  });

  isSend:boolean = false;
  

  constructor(private authService:AuthService){}


  sendEmail(){

    if(this.formEmail.valid){
      if (this.isEnableRecaptcha && !this.captchaResponse) {
        this.errorText = 'Por favor, completa el reCAPTCHA.';
        this.errorDiv = true;
        return;
      }
      this.executeAction();
    }

  }

  private executeAction(): void {

        if(this.formEmail.value.email!=null){

          this.authService.forgotPasswordSendEmail(this.formEmail.value.email, this.captchaResponse).subscribe(response=>{
            this.errorText="";
            this.errorDiv=false;
            this.isSend=true;
          },(error)=>{
            if(error.status==429){
              this.errorText="Usted es un robot, sino lo es... vuelva a intentar.";
              this.errorDiv=true;
            }else
              if(error.status==400){
                this.errorText="El email ingresado no existe en nuestros registros.";
                this.errorDiv=true;
                
              }
          });
        }
    }

  getErrorMessage(){
    if (this.formEmail.get('email')?.hasError('required')) 
      return 'Debe ingresar su email';
    if (this.formEmail.get('email')?.hasError('email')) 
      return 'Debe ingresar un email válido';

    return '';
  }

  responseToken($event:string){
    
    this.captchaResponse = $event;
  }
  
  activeRecaptcha($event:boolean){
    this.isEnableRecaptcha = $event;
  }

}
