import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { CitiesModel } from '@models/cities.model';
import { RegionModel } from '@models/regions.model';
import { ShippingBusiness } from '@models/shippingBusiness.model';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ShippingBusinessService {

  private readonly URL = environment.api_shipping_business;


  private readonly BUSINESS_SHIPPING = makeStateKey<ShippingBusiness[]>('business_shipping');
  //private readonly shippingMethods$: Subject<ShippingBusiness[]> = new Subject();
  //public readonly shippingMethods: Observable<ShippingBusiness[]> = this.shippingMethods$.asObservable();
  private $shippingMethods = signal<ShippingBusiness[]>([]);
  public readonly shippingMethodsSignal = this.$shippingMethods.asReadonly(); 

  private readonly shippingCost$: Subject<number> = new Subject();
  public readonly shippingCost: Observable<number> = this.shippingCost$.asObservable();

  private readonly regions$: Subject<RegionModel[]> = new Subject();
  public readonly regions: Observable<RegionModel[]> = this.regions$.asObservable();

  private readonly cities$: Subject<CitiesModel[]> = new Subject();
  public readonly cities: Observable<CitiesModel[]> = this.cities$.asObservable();


  constructor(private httpClient:HttpClient, private transferState: TransferState, @Inject(PLATFORM_ID) private platformId: Object) { }

  getShippingMetphods(){

    if(isPlatformServer(this.platformId))
      this.getShippingMetphodsCall();
        
    if(isPlatformBrowser(this.platformId)){
      
      const business_shipp = this.transferState.get(this.BUSINESS_SHIPPING, []);
      
      if(business_shipp.length>0){
        //console.log('metodos browser ', business_shipp);
        this.$shippingMethods.set(business_shipp)
      } else
         this.getShippingMetphodsCall();
      
    }
    
  }

  private  getShippingMetphodsCall(){

    this.httpClient.get <ShippingBusiness[]>(`${this.URL}`).subscribe(items => {
      //console.log('metodos ', items);
      this.transferState.set(this.BUSINESS_SHIPPING, items);
      this.$shippingMethods.set(items);
            
    });
  }

  getCost(cartId:string, shippingBusinessId:number){

    let termToJson = {cartId:cartId,shippingBusinessId:shippingBusinessId};

    this.httpClient.post<number>(`${this.URL}/cost`,termToJson).subscribe(item => {
      
      this.shippingCost$.next(item);
    });

  }

  getRegions(){

    this.httpClient.get <RegionModel[]>(`${this.URL}/regions`).subscribe(items => {

      this.regions$.next(items);
            
    });
  }

  getCities(regionId:number){
    this.httpClient.get <CitiesModel[]>(`${this.URL}/cities/${regionId}`).subscribe(items => {

      this.cities$.next(items);
            
    });

  }

}
