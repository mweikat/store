import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { Router } from '@angular/router';
import { MessageModel } from '@models/message.model';
import { NotificationAlarmModel } from '@models/notificationAlarm.model';
import { ProductModel } from '@models/product.model';
import { ProductBundle } from '@models/productBundle.model';
import { environment } from 'src/environments/environment';
import { MessagesService } from './messages.service';
import { ParamModel } from '@models/param.model';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  private readonly URL = environment.api_store;
  
  private readonly CURRENT_PRODUCT = makeStateKey<ProductModel>('currentProduct');
  //private readonly CURRENT_PRODUCT_ID = makeStateKey<string>('currentProductId');
  //private readonly CURRENT_PRODUCT_URL = makeStateKey<string>('currentProductUrl');
  public $currentProduct = signal<ProductModel>({} as ProductModel);

  private $productModelArray = signal<ProductModel[]>([]);
  public readonly productModelArraySignal = this.$productModelArray.asReadonly();

  private readonly PRODUCTS_BUNDLES = makeStateKey<ProductBundle[]>('products_bundles');
  private $productBundles = signal<ProductBundle[]>([]);
  public readonly productBundlesSignal = this.$productBundles.asReadonly();

  private readonly STATUS_NOTI = makeStateKey<ParamModel>('status_noti');
  public readonly $status_noti = signal<ParamModel>({} as ParamModel);
  
  constructor(private httpClient:HttpClient, private router: Router, 
              private transferState: TransferState, 
              @Inject(PLATFORM_ID) private platformId: Object,
              private messageService:MessagesService) { }

  
  getProduct(param:string, isUuid:boolean){

    
    if(isPlatformServer(this.platformId)){
      this.getProductByIdCall(param);
      return;
    }

    const current_product = this.transferState.get(this.CURRENT_PRODUCT, null);
    
    if(current_product && (current_product.id != param) && (current_product.url != param)){
      //console.log('tnego producto')
      this.getProductByIdCall(param);
      return;  
    }else
        if(current_product){
          this.$currentProduct.set(current_product);
          this.transferState.remove(this.CURRENT_PRODUCT);
          return;
        }

       
    
    this.getProductByIdCall(param);
    
  }

  private getProductByIdCall(param:string){

    this.httpClient.get <ProductModel>(`${this.URL}/product/${param}`).subscribe(receivedItem => {
      this.transferState.set(this.CURRENT_PRODUCT, receivedItem);
      this.$currentProduct.set(receivedItem);
    },err => {
            
      this.go404();

          
    })
  }


 async getProductsBundles(productId: string, categories:string[]) {

  if (isPlatformServer(this.platformId)) {
    await this.getProductsBundlesCall(productId, categories); // Espera a que termine
  } else {
    const product_bundles = this.transferState.get(this.PRODUCTS_BUNDLES, null);    
    
    if (product_bundles == null) {
      await this.getProductsBundlesCall(productId, categories); // Espera a que termine
    } else {
      this.$productBundles.set(product_bundles);
    }
    
    this.transferState.remove(this.PRODUCTS_BUNDLES);
  }
}

  // Devuelve un Promise<void> para poder usar await
  private getProductsBundlesCall(productId: string, categories:string[]): Promise<void> {
    
    return new Promise((resolve, reject) => {

      const toJsonPost = {productId:productId,categories:categories};

      this.httpClient.post<ProductBundle[]>(`${this.URL}/product-bundle`,toJsonPost).subscribe({
        next: (receivedItem) => {
          this.transferState.set(this.PRODUCTS_BUNDLES, receivedItem);
          this.$productBundles.set(receivedItem);
          resolve(); // Resuelve la promesa cuando se completa
        },
        error: (err) => reject(err), // Rechaza si hay error
      });
    });
  }

  searchProduct(term:string){

    let termToJson = {term:term};

    this.httpClient.post <ProductModel[]>(`${this.URL}/product_search`,termToJson).subscribe(items => {
      
      this.$productModelArray.set(items);
    }
    ,err => {
      this.$productModelArray.set([]);
    });

  }

  goSearchPage(term:string){
    
    this.router.navigate(['/categories/search'], { queryParams: { term: term } });

  }
  
  statusNotificationAlarm(){
    
    if(isPlatformServer(this.platformId)){
      this.statusNotificationCall();
    }else{

      const status_noti = this.transferState.get(this.STATUS_NOTI, null);
      
      if(status_noti===null){
        this.statusNotificationCall();
      }else{
        this.$status_noti.set(status_noti);
      }
    }

  }

  private statusNotificationCall(){

    this.httpClient.get<ParamModel>(`${this.URL}/product/notification-alarm-status`).subscribe(receivedItem => {
              
      this.transferState.set(this.STATUS_NOTI, receivedItem);    
      this.$status_noti.set(receivedItem);
                  
    });
  }

  saveNotificationAlarm(noti:NotificationAlarmModel){

    this.httpClient.post(`${this.URL}/product/notification-alarm`,noti).subscribe(items => {
      console.log("ok");  
      this.sendMessageService("Mensaje enviado!","Menssage Created","ok");
    }
    ,err => {
      console.log("Nok");  
       this.sendMessageService("No se pudo enviar el mensaje","Error","Nok");
    });

  }

  private go404(){
    this.router.navigate(['/404']);
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
