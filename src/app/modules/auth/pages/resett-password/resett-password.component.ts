import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ResetPasswordModel } from '@models/changeResetPassword.model';
import { AuthService } from '@services/auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-resett-password',
    templateUrl: './resett-password.component.html',
    styleUrl: './resett-password.component.scss',
    standalone: false
})
export class ResettPasswordComponent implements OnInit, OnDestroy{

  @ViewChild('newPasswordInput') newPasswordInput:ElementRef|any;
  @ViewChild('newPasswordConfirmInput') newPasswordConfirmInput:ElementRef|any;
  isShowing:boolean = true;
  eyeClass:string = 'visibility_off';

  destroyToken?:Subscription;

  token:string='';
  email:string='';

  resetPassword:ResetPasswordModel|any = {} as ResetPasswordModel;

  //messages
  showMessages:boolean=false;
  showMessageSuccess:boolean=false;
  text:string='';

  isEnablebtnReset:boolean=false;

  formUser = new FormGroup({
    email: new FormControl('',[Validators.required,Validators.maxLength(50),Validators.email]),
    new_password: new FormControl('',[Validators.required,Validators.maxLength(50),Validators.minLength(6)]),
    new_password_confirmed:new FormControl('',[Validators.required,Validators.maxLength(50),Validators.minLength(6)])
  });

  constructor(private route:ActivatedRoute, private authService:AuthService, 
    //@Inject(PLATFORM_ID) private platformId: Object
    ){

    let token:any = this.route.snapshot.paramMap.get('token');

    //if(isPlatformBrowser(this.platformId)){

      this.token = token;
      this.authService.getEmailByTokenResetPass(token);

    //}
  }
  ngOnDestroy(): void {
    if(this.destroyToken)
      this.destroyToken.unsubscribe();
  }

  ngOnInit(): void {

    
    //if(isPlatformBrowser(this.platformId))
    this.destroyToken = this.authService.emailReset.subscribe(email=>{
      
      if(email=="error"){
        this.text="Token expirado o inválido!, vuelva a intentarlo."
        this.showMessages=true;
        this.isEnablebtnReset = true;
      }
      else{

        this.email = email;

        this.formUser.setValue({
          
          email : this.email,
          new_password: '',
          new_password_confirmed: ''
        });
        
      }

    });



  }

  getErrorMessage(field:string){

     if (this.formUser.get(field)?.hasError('required')&&field=='new_password') 
      return 'Debe ingresar nueva contraseña';

    if (this.formUser.get(field)?.hasError('minlength')&&field=='new_password') 
      return 'La nueva contraseña debe tener un mínimo de 6 caracteres';

    if (this.formUser.get(field)?.hasError('pattern')&&field=='new_password_confirmed') 
      return 'Las contraseñas deben coincidir!';

    if (this.formUser.get(field)?.hasError('required')&&field=='new_password_confirmed') 
      return 'Debe ingresar confirmación de contraseña';

    return '';
  }

  showPass(){

    if(this.isShowing){

      
      this.newPasswordInput.nativeElement.type='password';
      this.newPasswordConfirmInput.nativeElement.type='password';
      this.eyeClass='visibility_off';
      this.isShowing=false;
    }else{


      this.newPasswordInput.nativeElement.type='text';
      this.newPasswordConfirmInput.nativeElement.type='text';
      this.eyeClass='visibility';
      this.isShowing=true;
    }
    
  }

  changePass(){

    if(this.formUser.valid){

      this.resetPassword.token = this.token;
      this.resetPassword.email = this.email;
      this.resetPassword.password = this.formUser.value.new_password;
      this.resetPassword.password_confirmation = this.formUser.value.new_password_confirmed;

      this.execute();
    }

  }

  private execute():void{

    this.authService.resetPassword(this.resetPassword).subscribe(response=>{
      this.isEnablebtnReset = true;
      this.text="Su contraseña ha sido cambiada con éxito";
      this.showMessageSuccess=true;
     
    },(error)=>{
      if(error.status==400)
        this.text='Los datos enviados no son correctos';

      if(error.status==408){
        this.text='El token ya ha expirado, favor vuelva a intentar enviando el email';
        this.isEnablebtnReset = true;
      }

      if(error.status==404){
        this.text='El email no existe en nuestros registros';
        this.isEnablebtnReset = true;
      }
      this.showMessages=true;
      
    });

  }

}
