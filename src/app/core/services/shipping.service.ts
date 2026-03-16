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

      this.msgModel = {} as MessageModel;
      this.msgModel.msg="Se crea una nueva dirección de despacho.";
      this.msgModel.active=1;
      this.msgModel.duration=2;
      this.msgModel.title="New Address";
      this.msgModel.icon="ok";
      this.msgModel.vertical = "top-0";
      this.messageService.sendMessage(this.msgModel);
    });

  }

  updateShippingAddress(shippingModel:ShippingAddress){

    this.httpClient.put<ShippingAddress>(`${this.URL}`,shippingModel).subscribe(item => {
      this.updatedShippingAddress$.next(item);

      this.msgModel = {} as MessageModel;
      this.msgModel.msg="Se actualiza la dirección.";
      this.msgModel.active=1;
      this.msgModel.duration=2;
      this.msgModel.title="Update Address";
      this.msgModel.icon="ok";
      this.msgModel.vertical = "top-0";
      this.messageService.sendMessage(this.msgModel);

    });

  }

  updateDefalutAddress(id:string){

    let shipToJson = {id:id};

    this.httpClient.put<ShippingAddress>(`${this.URL}/default`,shipToJson).subscribe(item => {

      this.msgModel = {} as MessageModel;
      this.msgModel.msg="Se actualiza la dirección por defecto.";
      this.msgModel.active=1;
      this.msgModel.duration=2;
      this.msgModel.title="Update Address Default";
      this.msgModel.icon="ok";
      this.msgModel.vertical = "top-0";
      this.messageService.sendMessage(this.msgModel);

    });

  }

  initEdt(ship:ShippingAddress){
    this.edtShippingAddress$.next(ship);
  }

  delete(ship:ShippingAddress){

    this.httpClient.delete(`${this.URL}/${ship.id}`,{ observe: 'response', responseType: 'text' }).subscribe(item => {

      this.msgModel = {} as MessageModel;
      this.msgModel.msg="La dirección ha sido eliminada con éxito.";
      this.msgModel.active=1;
      this.msgModel.duration=2;
      this.msgModel.title="Delete Address";
      this.msgModel.icon="ok";
      this.msgModel.vertical = "top-0";
      this.messageService.sendMessage(this.msgModel);

      this.deleteShippingAddress$.next(ship);

    });

  }


}
