import { SocialAuthService } from '@abacritt/angularx-social-login';
import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginModel } from '@models/login.model';
import { AuthService } from '@services/auth.service';
import { CustomvalidationService } from '@services/customvalidation.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    standalone: false
})
export class LoginComponent implements OnInit, OnDestroy{

  //password input
  @ViewChild('passwordInput') passwordInput:ElementRef|any;
  eyeClass:string = 'visibility_off';
  isShowing:boolean = false;
  loginModel:LoginModel = {} as LoginModel;

  loginError: boolean = false;
  //inject
  private fb:FormBuilder = inject(FormBuilder);
  private customValidator:CustomvalidationService = inject(CustomvalidationService);

  //destroyers
  destroyCToken?:Subscription;
  destroySocialAuth?:Subscription;

  constructor(
    private readonly authService:AuthService,
    private socialAuthService: SocialAuthService,
  ) { }
  ngOnDestroy(): void {
    if(this.destroyCToken)
      this.destroyCToken.unsubscribe();
    if(this.destroySocialAuth)
      this.destroySocialAuth.unsubscribe();
  }

  ngOnInit(): void {
    //if(isPlatformBrowser(this.platformId))
    this.isLoggedIn();

    this.destroyCToken = this.authService.currentToken.subscribe(user =>{
      
      if(user == '400'){
      
        this.loginError = true;  // Activa el estado de error
        this.form.get('password')?.markAsTouched(); // Marca el campo como tocado
        
      }
    
    });

    this.destroySocialAuth = this.socialAuthService.authState.subscribe((user) => {
      if (user) {
        this.handleGoogleLogin(user.idToken);
      }
    });
    
  }

  form:FormGroup = this.fb.group({
    email: ['',[Validators.required,Validators.pattern(this.customValidator.emailValidation())]],
    password: ['',Validators.required]
  });

  

  login(){
    const val = this.form.value;

    //check again if logged in, if client load another tab
    if(!this.isLoggedIn()){
      if(this.form.valid){

        this.loginModel.user = {'email':val.email, 'password':val.password};
        this.authService.login(this.loginModel, false);
      }
    }
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

  
  // En tu componente TypeScript
  getEmailErrorMessage() {
    const emailControl = this.form.get('email');
    
    if (emailControl?.hasError('required')) {
      return 'Debe ingresar un email';
    }
    
    if (emailControl?.hasError('pattern')) {
      return 'Debe ingresar un email válido';
    }
    
    return '';
  }

  getPasswordErrorMessage() {
    const passwordControl = this.form.get('password');
    
    if (passwordControl?.hasError('required')) {
      return 'Debe ingresar una contraseña';
    }
    
    if (this.loginError) {
      return "Email o contraseña inválidas";
    }
    
    return '';
  }

  private handleGoogleLogin(idToken: string) {
   //console.log("idtoken ", idToken);
   this.authService.loginGoogle(idToken, false);
  }

}
