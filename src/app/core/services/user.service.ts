import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { UserModel } from '@models/user.model';
import { environment } from 'src/environments/environment';
import { MessagesService } from './messages.service';
import { HttpClient } from '@angular/common/http';
import { MessageModel } from '@models/message.model';
import { AuthService } from './auth.service';
import { ChangePasswordModel } from '@models/changePassword.model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private URL =  environment.api_user;

  user:UserModel = {} as UserModel;

  //private readonly userName$: Subject<ShippingAddress[]> = new Subject();
  //public readonly shippingAddress: Observable<ShippingAddress[]> = this.userName$.asObservable();

  constructor(private httpClient:HttpClient, 
              private messageService:MessagesService, 
              private authService:AuthService, 
              @Inject(PLATFORM_ID) private platformId: Object) { }

  updateUserInfo(user:UserModel){

    let userToJson = {name:user.name, lastName:user.lastName, phone:user.phone};

    this.httpClient.put(`${this.URL}`,userToJson).subscribe(item => {

      const msgModel = {} as MessageModel;
      msgModel.msg="Información actualizada correctamente.";
      msgModel.active=1;
      msgModel.duration=2;
      msgModel.title="Update User";
      msgModel.icon="ok";
      msgModel.vertical = "top-0";

      this.messageService.sendMessage(msgModel);
      this.authService.setUserItemStorage(user);
    });

  }

  getUserLoggedInfoFromServer(){

    if(isPlatformBrowser(this.platformId)){

      this.httpClient.get<UserModel> (`${this.URL}`).subscribe(receivedItem => {
        this.authService.setUserItemStorage(receivedItem);
      });

    }



  }

  changePassword(changePass:ChangePasswordModel){

    this.httpClient.put(`${this.URL}/change-password`,changePass, { responseType: 'text'}).subscribe(recivedItem=>{

      const msgModel = {} as MessageModel;
      msgModel.msg="Información actualizada correctamente.";
      msgModel.active=1;
      msgModel.duration=2;
      msgModel.title="Update User Pass";
      msgModel.icon="ok";
      msgModel.vertical = "top-0";

      this.messageService.sendMessage(msgModel);

    },(error) => {
      if(error.status==401){
        const msgModel = {} as MessageModel;
        msgModel.msg="Su contraseña actual no es correcta";
        msgModel.active=1;
        msgModel.duration=2;
        msgModel.title="Update User Pass";
        msgModel.icon="nok";
        msgModel.vertical = "top-0";
        
        this.messageService.sendMessage(msgModel);
      }
    });

  }

  resendVerifiedEmail(){

    this.httpClient.post(`${this.URL}/send-email-verifications`,{}, { responseType: 'text'}).subscribe(item=>{
      
      const msgModel = {} as MessageModel;
      msgModel.msg="Email de Verificación enviado.";
      msgModel.active=1;
      msgModel.duration=2;
      msgModel.title="Email Confirmation Sended";
      msgModel.icon="ok";
      msgModel.vertical = "top-0";

      this.messageService.sendMessage(msgModel);
    })

  }

}
