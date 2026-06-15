import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ShippingAddress } from '@models/shippingAddress.model';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MessagesService } from './messages.service';
import { MessageModel } from '@models/message.model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ShippingService {

  private readonly URL = environment.api_shipping_client; 
  private msgModel:MessageModel = {} as MessageModel;

  private readonly shippingAddress$: Subject<ShippingAddress[]> = new Subject();
  public readonly shippingAddress: Observable<ShippingAddress[]> = this.shippingAddress$.asObservable();

  private readonly newShippingAddress$: Subject<ShippingAddress> = new Subject();
  public readonly newShippingAddress: Observable<ShippingAddress> = this.newShippingAddress$.asObservable();

  private readonly edtShippingAddress$: Subject<ShippingAddress> = new Subject();
  public readonly edtShippingAddress: Observable<ShippingAddress> = this.edtShippingAddress$.asObservable();

  private readonly updatedShippingAddress$: Subject<ShippingAddress> = new Subject();
  public readonly updatedShippingAddress: Observable<ShippingAddress> = this.updatedShippingAddress$.asObservable();

  private readonly deleteShippingAddress$: Subject<ShippingAddress> = new Subject();
  public readonly deleteShippingAddress: Observable<ShippingAddress> = this.deleteShippingAddress$.asObservable();

  constructor(private httpClient:HttpClient, private messageService:MessagesService, @Inject(PLATFORM_ID) private platformId: Object) { }

  getShippingAdress(){

    if(isPlatformBrowser(this.platformId))
      this.httpClient.get <ShippingAddress[]>(`${this.URL}`).subscribe(items => {

        this.shippingAddress$.next(items);
              
      });
  }

  storeShippingAddress(shippingModel:ShippingAddress){

    this.httpClient.post<ShippingAddress>(`${this.URL}`,shippingModel).subscribe(item => {
      
      this.newShippingAddress$.next(item);
      this.getShippingAdress();
      this.sendMessageService("Se crea una nueva dirección de despacho.","New Address","ok");
    });

  }

  updateShippingAddress(shippingModel:ShippingAddress){

    this.httpClient.put<ShippingAddress>(`${this.URL}`,shippingModel).subscribe(item => {
      
      this.updatedShippingAddress$.next(item);
      this.sendMessageService("Se actualiza la dirección.","Update Address","ok");

    });

  }

  updateDefalutAddress(id:string){

    let shipToJson = {id:id};

    this.httpClient.put<ShippingAddress>(`${this.URL}/default`,shipToJson).subscribe(item => {

      this.sendMessageService("Se actualiza la dirección por defecto.","Update Address Default","ok");

    });

  }

  initEdt(ship:ShippingAddress){
    this.edtShippingAddress$.next(ship);
  }

  delete(ship:ShippingAddress){

    this.httpClient.delete(`${this.URL}/${ship.id}`,{ observe: 'response', responseType: 'text' }).subscribe(item => {

      this.sendMessageService("La dirección ha sido eliminada con éxito.","Delete Address","ok");

      this.deleteShippingAddress$.next(ship);

      this.getShippingAdress();

    });

  }

  private sendMessageService(msg:string, title:string, icon:string){

    let msgModel = {} as MessageModel;
    msgModel.msg=msg;
    msgModel.active=1;
    msgModel.duration=5;
    msgModel.title=title;
    msgModel.icon=icon;

    this.messageService.sendMessage(msgModel);
  }


}
