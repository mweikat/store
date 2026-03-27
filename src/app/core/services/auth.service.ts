import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LoginModel } from '@models/login.model';
import { ResetPasswordModel } from '@models/changeResetPassword.model';
import { UserModel } from '@models/user.model';
import { CartService } from './cart.service';
import { CartModel } from '@models/cart.model';
import { LoginResponseModel } from '@models/loginResponse.model';
import { MessageModel } from '@models/message.model';
import { MessagesService } from './messages.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly URL = environment.apiAuth;

  private readonly token$: BehaviorSubject<any> = new BehaviorSubject({} as any);
  public readonly currentToken: Observable<any> = this.token$.asObservable();

  private readonly user$: Subject<UserModel> = new Subject();
  public readonly currentUser: Observable<any> = this.user$.asObservable();

  private readonly recaptcha$: BehaviorSubject<any> = new BehaviorSubject({} as any);
  public readonly recaptcha: Observable<any> = this.recaptcha$.asObservable();

  private readonly emailReset$: Subject<any> = new Subject();
  public readonly emailReset: Observable<any> = this.emailReset$.asObservable();

  private $verify_response = signal<boolean>(false);
  public readonly verify_response = this.$verify_response.asReadonly();

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private cartService: CartService,
    private messageService: MessagesService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login(loginModel: LoginModel, goCheckout: boolean) {
    this.httpClient.post<LoginResponseModel>(`${this.URL}/login`, loginModel).subscribe(
      receivedItem => {
        this.postLogin(receivedItem, goCheckout);
      },
      err => {
        if (err.status === 400) {
          this.token$.next("400");
        }
      }
    );
  }

  loginGoogle(userToken: string, goCheckout: boolean) {
    this.httpClient.post<LoginResponseModel>(`${this.URL}/google-login`, { token: userToken }).subscribe(
      receivedItem => {
        this.postLogin(receivedItem, goCheckout);
      },
      err => {
        console.error('Error en login backend:', err);
      }
    );
  }

  setUserItemStorage(user: UserModel) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    this.user$.next(user);
  }

  isLoggedIn() {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token') !== null && localStorage.getItem('user') !== null;
    }
    return false;
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
      this.router.navigate(['/']).then(() => {
        window.location.href = '/';
      });
    }
  }

  getToken() {
    if (isPlatformBrowser(this.platformId)) {
      const userStorage = localStorage.getItem('access_token');
      return userStorage ? JSON.parse(userStorage) : null;
    }
    return null;
  }

  getUserFromLocalStorage() {
    if (isPlatformBrowser(this.platformId)) {
      const userStorage = localStorage.getItem('user');
      if (userStorage) {
        return JSON.parse(userStorage) as UserModel;
      }
    }
    return {} as UserModel;
  }

  goHomePage() {
    this.router.navigate(['/']);
  }

  goCheckout() {
    this.router.navigate(['/checkout']);
  }

  forgotPasswordSendEmail(email: string, recaptcha: string | null) {
    const emailToJson = { email, recaptcha };
    return this.httpClient.post(`${this.URL}/send-password-reset`, emailToJson, { observe: 'response', responseType: 'text' });
  }

  getEmailByTokenResetPass(token: string) {
    this.httpClient.get<any>(`${this.URL}/send-password-reset/${token}`).subscribe(
      resp => {
        this.emailReset$.next(resp.email);
      },
      err => {
        if (err.status === 404) {
          const msgModel = {
            msg: "El token ha caducado o es inválido",
            active: 1,
            duration: 3,
            title: "Error on Update Quantity",
            icon: "nok",
            vertical: "top-0"
          } as MessageModel;
          this.messageService.sendMessage(msgModel);
          this.emailReset$.next("error");
        }
      }
    );
  }

  resetPassword(resetPasswordModel: ResetPasswordModel) {
    return this.httpClient.post(`${this.URL}/password/reset`, resetPasswordModel, { observe: 'response', responseType: 'text' });
  }

  verifyEmail(url: string) {
    const formattedUrl = url.replace('_', '?').replace(/@/g, '=');

    if (isPlatformBrowser(this.platformId)) {
      this.httpClient.get<any>(`${this.URL}/email-confirm/${formattedUrl}`).subscribe(
        result => {
          this.$verify_response.set(true);
        },
        error => {
          // Error handling
        }
      );
    }
  }

  register(user: UserModel) {
    return this.httpClient.post(`${this.URL}/register`, user, { observe: 'response', responseType: 'json' });
  }

  isRecaptcha() {
    this.httpClient.get<any>(`${this.URL}/isrecaptcha`).subscribe(resp => {
      this.recaptcha$.next(resp.result);
    });
  }

  private asociateCart() {
    if (isPlatformBrowser(this.platformId)) {
      const cart: CartModel = this.cartService.getCartFromLocalSession();
      if (cart.id !== undefined) {
        this.cartService.asosiateCart(cart.id);
      }
    }
  }

  private postLogin(receivedItem: LoginResponseModel, goCheckout: boolean) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('access_token', JSON.stringify(receivedItem.access_token));
    }
    this.setUserItemStorage(receivedItem.user);
    this.asociateCart();

    if (goCheckout) {
      this.goCheckout();
    } else {
      this.goHomePage();
    }
  }
}
