import { SocialAuthService } from '@abacritt/angularx-social-login';
import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginModel } from '@models/login.model';
import { MessageModel } from '@models/message.model';
import { UserModel } from '@models/user.model';
import { AuthService } from '@services/auth.service';
import { CustomvalidationService } from '@services/customvalidation.service';
import { MessagesService } from '@services/messages.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-fast-register',
    templateUrl: './fast-register.component.html',
    styleUrl: './fast-register.component.scss',
    standalone: false
})
export class FastRegisterComponent implements OnInit, OnDestroy{

  /******************register******************** */

  @ViewChild('passwordInput') passwordInput:ElementRef|any;
  eyeClass:string = 'visibility_off';
  isShowing:boolean = false;
  errorOnRegister:any;

  //captcha vars
  captchaResponse: string | null = null; // Respuesta del reCAPTCHA
  isEnableRecaptcha:boolean = true;

  //show form
  showForm:boolean = false;

  userModel:UserModel = {} as UserModel;

  private fb:FormBuilder = inject(FormBuilder);
  private customValidator:CustomvalidationService = inject(CustomvalidationService);

  form:FormGroup = this.fb.group({
    name:['',Validators.required],
    lastName:['',Validators.maxLength(30)],
    email: ['',[Validators.required,Validators.pattern(this.customValidator.emailValidation())]],
    password: ['',Validators.required],
    terms: [false,Validators.requiredTrue],
    phone: ['',Validators.required]
  });

  //register google
  destroySocialAuth?:Subscription;


  constructor(private authService:AuthService,
              private messageService:MessagesService,
              private socialAuthService: SocialAuthService,
   ){}

  ngOnDestroy(): void {
    if(this.destroySocialAuth)
      this.destroySocialAuth.unsubscribe();
  }

  ngOnInit(): void {

    this.destroySocialAuth = this.socialAuthService.authState.subscribe((user) => {
      if (user) {
        this.handleGoogleLogin(user.idToken);
      }
    });
  }



  isLoggedIn():boolean{
    if(this.authService.isLoggedIn()){
      this.authService.goHomePage();
      return true;
    }else
      return false;
  }

  showPass(){

    if(this.isShowing){
      this.passwordInput.nativeElement.type='password';
      this.eyeClass='visibility_off';
      this.isShowing=false;
    }else{
      this.passwordInput.nativeElement.type='text';
      this.eyeClass='visibility';
      this.isShowing=true;
    }
    
  }

  register(){
    
    if (this.form.valid) {

      if (this.isEnableRecaptcha && !this.captchaResponse) {
        this.errorOnRegister = 'Por favor, completa el reCAPTCHA.';
        return;
      }

      this.errorOnRegister = null; 
      this.executeAction();
        
    }else{
      this.form.markAllAsTouched();
      return;
    }
  } 

  getErrorMessage(field:string) {
    
    if (field=='name'&&this.form.get('name')?.hasError('required')) 
      return '*Nombre es requerido';

    if (field=='phone'&&this.form.get('phone')?.hasError('required')) 
      return '*Telefono es requerido';

    if (field=='lastName'&&this.form.get('lastName')?.hasError('required')) 
      return '*Apellido es requerido';
    
    if ((field=='email')&&(this.form.get('email')?.hasError('required')||this.form.get('email')?.hasError('pattern'))) 
      return '*Email no es válido';
    
    if ((field=='password')&&(this.form.get('password')?.hasError('required')||
        this.form.get('password')?.hasError('maxlength')||
        this.form.get('password')?.hasError('minlength')))
      return '*Contraseña entre 6 y 20 caracteres';
    
    if(field=='terms'&&this.form.get('terms')?.hasError('required'))
      return 'Debe aceptar los Términos y Condiciones';

    return '';
  }

  activeRecaptcha($event:boolean){
    this.isEnableRecaptcha = $event;
  }

  responseToken($event:string){
    this.captchaResponse = $event;
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.key.charCodeAt(0);
    // Permitir números (0–9) y teclas especiales como retroceso (Backspace)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  private executeAction(): void {

           
    this.userModel.name = this.form.value.name;
    this.userModel.lastName = this.form.value.lastName;
    this.userModel.email = this.form.value.email;
    this.userModel.password = this.form.value.password;
    this.userModel.phone = this.form.value.phone;

    if(this.captchaResponse)
      this.userModel.recaptcha = this.captchaResponse;

    this.authService.register(this.userModel).subscribe(receivedItem => {

      this.errorOnRegister='';

      const loginModel:LoginModel = {user:{email:this.userModel.email, password:this.userModel.password}}
      
      this.authService.login(loginModel,true);

      const msgModel = {} as MessageModel;
      msgModel.msg="Registro exitoso, le hemos enviado un correo electronico para que confirme su cuenta.";
      msgModel.active=1;
      msgModel.duration=6;
      msgModel.title="Register User";
      msgModel.icon="ok";
      msgModel.vertical = "top-0";

      this.messageService.sendMessage(msgModel);
          
    },(error) => {

      if(error.error.email!=undefined){
        this.errorOnRegister = error.error.email;
      }else
        if(error.status==429){
          this.errorOnRegister = "Usted es un robot, sino lo es vuelva a intentar";
        }if(error.status==409){
          this.errorOnRegister = "El correo ya esta siendo utilizado";
        }
        
    });

}

fnShowForm(){
  this.showForm = !this.showForm;
}

private handleGoogleLogin(idToken: string) {
  //console.log("idtoken ", idToken);
  this.authService.loginGoogle(idToken, true);
 }
  
}
