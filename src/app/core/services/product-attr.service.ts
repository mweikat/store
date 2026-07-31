import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { ProductVariantTypeModel } from '@models/productVariantType.model';
import { environment } from 'src/environments/environment';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ProductVariantSkuModel } from '@models/productVariantSku.model';

@Injectable({
  providedIn: 'root'
})
export class ProductAttrService {

  private readonly URL = environment.api_store;

  private readonly PRODUCT_ATTR = makeStateKey<ProductVariantTypeModel[]>('productAttr');
  private readonly SKU_SELECTED = makeStateKey<ProductVariantSkuModel>('skuSelected');

  public $productAttrArray = signal<ProductVariantTypeModel[]>([]);
  public readonly $skuSelected = signal<ProductVariantSkuModel>({} as ProductVariantSkuModel);
  public readonly $stockVariant = signal<number>(-1);
  public $isConsulting = signal<boolean>(false);

  constructor(private httpClient:HttpClient, 
              private transferState: TransferState, 
              @Inject(PLATFORM_ID) private platformId: Object) { }

  getProductAttrById(productId:string){

    if(isPlatformServer(this.platformId)){
      this.getProductAttrByIdCall(productId);
      return;
    }

    const productAttr = this.transferState.get(this.PRODUCT_ATTR, []);
    if(productAttr&&productAttr.length>0){
       this.$productAttrArray.set(productAttr);
       this.transferState.remove(this.PRODUCT_ATTR);
    }else{
       this.getProductAttrByIdCall(productId);
    }
  }

  private getProductAttrByIdCall(productId:string){

    this.httpClient.get <ProductVariantTypeModel[]>(`${this.URL}/product-attr/${productId}`).subscribe(receivedItem => {
      this.transferState.set(this.PRODUCT_ATTR, receivedItem);
      this.$productAttrArray.set(receivedItem);
    });
  }

  getSkuSelected(productId:string, selectedAttributes:string[]){
    this.$isConsulting.set(true);
    if(isPlatformServer(this.platformId)){
      this.getSkuSelectedCall(productId, selectedAttributes);
      return;
    }

    const skuSelected = this.transferState.get(this.SKU_SELECTED, {} as ProductVariantSkuModel);
    //console.log("skuSelected 1", skuSelected);
    if(skuSelected && skuSelected.sku!=undefined){
      //console.log("entra skuSelected ", skuSelected);
      this.$skuSelected.set(skuSelected); 
      this.transferState.set(this.SKU_SELECTED, {} as ProductVariantSkuModel);
  
     }else{
      //console.log("LLama ");
      this.getSkuSelectedCall(productId, selectedAttributes)
    }

    
  }

  private getSkuSelectedCall(productId:string, selectedAttributes:string[]){

    const toJsonPost = {productId:productId,attrs:selectedAttributes};
    this.httpClient.post <ProductVariantSkuModel>(`${this.URL}/product-attr-selected`,toJsonPost).subscribe(receivedItem => {
      
      if(isPlatformServer(this.platformId)){
        this.transferState.set(this.SKU_SELECTED, receivedItem);
      }
      this.$skuSelected.set(receivedItem);

    });
    
  }

  getSkuAttrStock(sku:string){

    if(isPlatformBrowser(this.platformId)){
      this.httpClient.get <ProductVariantSkuModel>(`${this.URL}/product-attr-stock/${sku}`).subscribe(receivedItem => {
        this.$stockVariant.set(receivedItem.stock);
      });
    }

  }


}
