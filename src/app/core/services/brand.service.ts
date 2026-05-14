import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { BrandModel } from '@models/brand.model';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';
import { BusinessService } from './business.service';

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
              @Inject(PLATFORM_ID) private platformId: Object,
              private storageService: StorageService,
              private businessService:BusinessService) { }


  public getBrands(ttl:string){
    
    if(isPlatformServer(this.platformId))
      this.getBrandsCall(ttl);
    else{
      const storageKey = 'brands_' + this.businessService.getNameHost();
      const home_brands = this.transferState.get(this.HOME_BRANDS, []);
      
      if((home_brands).length>0){
        
        this.$brandArray.set(home_brands);
        //console.log("Cargado desde cache con TransferState", ttl);
        // Limpiar el estado transferido para liberar memoria, ya que ahora tenemos los datos en el signal y guardamos cache solo en StorageService
        this.transferState.remove(this.HOME_BRANDS); 
        // ✅ Guardar con expiración usando el service
        this.storageService.setWithExpiry(storageKey, home_brands, ttl);


      }else{
        
        const storedBrands = this.storageService.getWithExpiry<BrandModel[]>(storageKey);
        if (storedBrands) {
          this.$brandArray.set(storedBrands);
          //console.log("Cargado desde cache con StorageService", ttl);
        }else
          this.getBrandsCall(ttl);
      } 
        
    }
  }              

  private getBrandsCall(ttl:string){
  
    this.httpClient.get<BrandModel[]>(`${this.URL_PRODUCTS}/brands`).subscribe(receivedItem => {
          
      this.transferState.set(this.HOME_BRANDS, receivedItem);    
      this.$brandArray.set(receivedItem);

      // ✅ Guardar cache con expiración
      if (isPlatformBrowser(this.platformId)) {
        const storageKey = 'brands_' + this.businessService.getNameHost();
        this.storageService.setWithExpiry(storageKey, receivedItem, ttl);
      }
              
    });
  }

}
