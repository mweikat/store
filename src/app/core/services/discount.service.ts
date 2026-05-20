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

  private $discounts = signal<DiscountModel[]>([]);
  public readonly discountsSignal = this.$discounts.asReadonly(); 

  constructor(private httpClient:HttpClient,  @Inject(PLATFORM_ID) private platformId: Object) { }

  getActiveDiscounts(){
    if(isPlatformBrowser(this.platformId))
      this.getActiveDiscountsCall();
  }

  private getActiveDiscountsCall(){
    this.httpClient.get<DiscountModel[]>(`${this.URL}/discounts`).subscribe(items => {
      //console.log("llamando discount: ", items);
      this.$discounts.set(items);
    });
  }
}
