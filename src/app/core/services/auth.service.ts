import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LoginModel } from '@models/login.model';
import { ResetPasswordModel } from '@models/changeResetPassword.model';
import { UserService } from './user.service';
import { UserModel } from '@models/user.model';
import { CartService } from './cart.service';
import { CartModel } from '@models/cart.model';
import { LoginResponseModel } from '@models/loginResponse.model';
import { MessageModel } from '@models/message.model';
import { MessagesService } from './messages.service';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { SocialUser } from '@abacritt/angularx-social-login';
import { blob } from 'stream/consumers';
import { error } from 'console';
/*import { UserModel } from '@models/user.model';
import { MessagesService } from './messages.service';
import { MessageModel } from '@models/message.model';
import { ResetPasswordModel } from '@models/changeResetPassword.model';
import { BusinessService } from './business.service';
import { BusinessModel } from '../models/business.model';
*/

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly URL = environment.apiAuth;
  //private readonly business_id = environment.id_business;

  private readonly token$: BehaviorSubject<any> = new BehaviorSubject( {} as any);
  public readonly currentToken: Observable<any> = this.token$.asObservable();

  private readonly user$: Subject<UserModel> = new Subject();
  public readonly currentUser: Observable<any> = this.user$.asObservable();

  private readonly recaptcha$: BehaviorSubject<any> = new BehaviorSubject({} as any);
  public readonly recaptcha: Observable<any> = this.recaptcha$.asObservable();

  private readonly emailReset$: Subject<any> = new Subject();
  public readonly emailReset: Observable<any> = this.emailReset$.asObservable();

  //private readonly VERIFI_EMAIL = makeStateKey<boolean>('verify_email');
  private $verify_response = signal<boolean>(false);
  public readonly verify_response = this.$verify_response.asReadonly();

  constructor(private httpClient:HttpClient, 
              private router:Router,
              private cartService:CartService,
              private transferState: TransferState,
              private messageService:MessagesService,
              @Inject(PLATFORM_ID) private platformId: Object
            ) { }

  login (loginModel:LoginModel, goCheckout:boolean){
    
    this.httpClient.post<LoginResponseModel> (`${this.URL}/login`,loginModel).subscribe(receivedItem => {
      
      this.postLogin(receivedItem, goCheckout);
            
    },err => {
            
        if(err.status===400){
          this.token$.next("400");
          
        }
          
      }
    )
  }

  loginGoogle(userToken:String, goCheckout:boolean){
    

    this.httpClient.post<LoginResponseModel>(`${this.URL}/google-login`, {token: userToken}).subscribe(receivedItem =>{
      
        //console.log('Respuesta backend:', receivedItem);
        this.postLogin(receivedItem, goCheckout);
    },
       err => {
        console.error('Error en login backend:', err);
       
    });

  }

  setUserItemStorage(user:UserModel){
    
    localStorage.setItem('user',JSON.stringify(user));
    this.user$.next(user);

  }

  isLoggedIn() {

    if(isPlatformBrowser(this.platformId)){ 
    
      if(localStorage.getItem('access_token')!=null && localStorage.getItem('user')!=null)
        return true;
      
      return false;
      
    }

    return false;
  }
  
  logout() {
    if(isPlatformBrowser(this.platformId)){ 
      this.removeLocalStorage();
      this.router.navigate(['/']).then(() => {
        window.location.href = '/';
      });
    }
  }

  removeLocalStorage(){
    localStorage.clear();
  }

  getToken(){
    const userStorage = localStorage.getItem('access_token');
    return JSON.parse(userStorage!);
  }

  getUserFromLocalStorage(){

    if(isPlatformBrowser(this.platformId)){ 

      const userStorage = localStorage.getItem('user');
      if(userStorage){
        const userModel:UserModel = JSON.parse(userStorage!);
        return userModel;
      }

    }

    return {} as UserModel;
  }

  goHomePage(){    
    this.router.navigate(['/']);
  }

  goCheckout(){
    this.router.navigate(['/checkout']);
  }

  forgotPasswordSendEmail(email:string, recaptcha:string|null){
    let emailToJson = {email:email, recaptcha:recaptcha};
    return this.httpClient.post(`${this.URL}/send-password-reset`,emailToJson,{observe: 'response', responseType: 'text'});

  }

  getEmailByTokenResetPass(token:string){

    this.httpClient.get<any>(`${this.URL}/send-password-reset/${token}`).subscribe( resp=>{
      this.emailReset$.next(resp.email);
  },(err)=>{

    if(err.status=404){
      
      const msgModel = {} as MessageModel;
      msgModel.msg="El token ha caducado o es inválido";
      msgModel.active=1;
      msgModel.duration=3;
      msgModel.title="Error on Update Quantity";
      msgModel.icon="nok";
      msgModel.vertical = "top-0";
      this.messageService.sendMessage(msgModel);

      this.emailReset$.next("error");
    }
  });
  
  }

  resetPassword(resetPasswordModel:ResetPasswordModel){

    return this.httpClient.post(`${this.URL}/password/reset`,resetPasswordModel,{observe: 'response', responseType: 'text'});
   
   }

  verifyEmail(url:string){

    url = url.replace('_','?');
    url = url.replace(/@/g,'=');

    if(isPlatformBrowser(this.platformId)){
      this.httpClient.get<any>(`${this.URL}/email-confirm/${url}`).subscribe( result => {
        //this.transferState.set(this.VERIFI_EMAIL, true);
        this.$verify_response.set(true);
        //console.log('respuesta ssr enviar email ', result);
      },error=>{
        //console.log('error al verificar email');
      });
    }/*else{
      const current_verify = this.transferState.get(this.VERIFI_EMAIL, false);
      this.$verify_response.set(current_verify);
      console.log('respuesta browser enviar email ', current_verify);
    }*/

    
  }


   
  register(user:UserModel){

    return this.httpClient.post(`${this.URL}/register`,user,{observe: 'response', responseType: 'json'});

  }

  isRecaptcha(){
    this.httpClient.get<any>(`${this.URL}/isrecaptcha`).subscribe( resp=>{

        this.recaptcha$.next(resp.result);
    });
  }



  private asociateCart(){

    if(isPlatformBrowser(this.platformId)){ 

      let cart:CartModel = this.cartService.getCartFromLocalSession();
      if(cart.id!=undefined)
        this.cartService.asosiateCart(cart.id);

    }
    
    
  }

  private postLogin(receivedItem:LoginResponseModel, goCheckout:boolean){

    localStorage.setItem('access_token',JSON.stringify(receivedItem.access_token));

      const userRecived:UserModel = receivedItem.user;
      this.setUserItemStorage(userRecived);

      //asocio cart si existe
      this.asociateCart();

      if(goCheckout)
        this.goCheckout();
      else
        this.goHomePage();

  }

}
