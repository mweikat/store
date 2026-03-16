import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { MessagesService } from './messages.service';
import { ProductVariantTypeModel } from '@models/productVariantType.model';
import { environment } from 'src/environments/environment';
import { isPlatformServer } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ProductAttrService {

  private readonly URL = environment.api_store;

  private readonly PRODUCT_ATTR = makeStateKey<ProductVariantTypeModel[]>('productAttr');
  public $productAttrArray = signal<ProductVariantTypeModel[]>([]);

  constructor(private httpClient:HttpClient, 
              private transferState: TransferState, 
              @Inject(PLATFORM_ID) private platformId: Object,
              private messageService:MessagesService) { }

  getProductAttrById(productId:string){

    if(isPlatformServer(this.platformId)){
      this.getProductAttrByIdCall(productId);
      return;
    }

    const productAttr = this.transferState.get(this.PRODUCT_ATTR, []);
    productAttr&&productAttr.length>0? this.$productAttrArray.set(productAttr) : this.getProductAttrByIdCall(productId);

  }

  private getProductAttrByIdCall(productId:string){

    this.httpClient.get <ProductVariantTypeModel[]>(`${this.URL}/product-attr/${productId}`).subscribe(receivedItem => {
      this.transferState.set(this.PRODUCT_ATTR, receivedItem);
      this.$productAttrArray.set(receivedItem);
    })
  }


}
