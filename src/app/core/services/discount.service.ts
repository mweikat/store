import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { DiscountModel } from '@models/discount.model';
import { error } from 'console';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DiscountService {

  private URL = environment.api_store;

  //private readonly discountfirstbuy$: Subject<DiscountModel> = new Subject();
  //public readonly discountfirstbuy: Observable<DiscountModel> = this.discountfirstbuy$.asObservable();

  private $discounts = signal<DiscountModel[]>([]);
  public readonly discountsSignal = this.$discounts.asReadonly(); 

  constructor(private httpClient:HttpClient,  @Inject(PLATFORM_ID) private platformId: Object) { }

  /*showDiscountFirstBuy(){

    if(isPlatformBrowser(this.platformId)){

      this.httpClient.get<DiscountModel>(`${this.URL}/discount-first-buy/${this.business_id}`).subscribe(items => {
            
            this.$discountfirstbuy.set(items);
      
      },error=>{
         this.$discountfirstbuy.set({} as DiscountModel);
      });
    }

  }*/

    getActiveDiscounts(){
      this.getActiveDiscountsCall();
    }

    private getActiveDiscountsCall(){
      this.httpClient.get<DiscountModel[]>(`${this.URL}/discounts`).subscribe(items => {
        this.$discounts.set(items);
      });
    }
}
