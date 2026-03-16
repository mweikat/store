import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { BrandModel } from '@models/brand.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BrandService {

  private readonly URL_PRODUCTS = environment.api_store;

  
  private readonly HOME_BRANDS = makeStateKey<BrandModel[]>('home_brands');
  private $brandArray = signal<BrandModel[]>([]);
  public readonly brandArraySignal = this.$brandArray.asReadonly(); 

  constructor(private httpClient:HttpClient,
              private transferState: TransferState, 
              @Inject(PLATFORM_ID) private platformId: Object) { }


  public getBrands(){
    
    if(isPlatformServer(this.platformId))
      this.getBrandsCall();
    else{
      const home_brands = this.transferState.get(this.HOME_BRANDS, []);
      (home_brands).length>0? this.$brandArray.set(home_brands) : this.getBrandsCall();
    }
  }              

  private getBrandsCall(){

    this.httpClient.get<BrandModel[]>(`${this.URL_PRODUCTS}/brands`).subscribe(receivedItem => {
          
      this.transferState.set(this.HOME_BRANDS, receivedItem);    
      this.$brandArray.set(receivedItem);
              
    });
  }

}
