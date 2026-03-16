import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { DeliveryModel } from '@models/delivery.model';
import { ScheduleModel } from '@models/schedule.model';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {

  private readonly URL = environment.api_shipping_business;


  private readonly SCHEDULE_KEY = makeStateKey<ScheduleModel[]>('schedule');
  private readonly schedule$: BehaviorSubject<ScheduleModel[]> = new BehaviorSubject<ScheduleModel[]>([]);
  public readonly schedule: Observable<ScheduleModel[]> = this.schedule$.asObservable();

  private $deliveryData = signal<DeliveryModel|null>({} as DeliveryModel);
  public readonly deliveryDataSignal = this.$deliveryData.asReadonly();

  constructor(private httpClient:HttpClient,private transferState: TransferState, @Inject(PLATFORM_ID) private platformId: Object) { }

  getSchedule(){

    if(isPlatformServer(this.platformId))
          this.getScheduleCall();
        
    if(isPlatformBrowser(this.platformId)){
     
      const schedule = this.transferState.get(this.SCHEDULE_KEY, []);
      
      if(schedule.length>0)
        this.schedule$.next(schedule);
      else 
        this.getScheduleCall();
      
    }

  }

  private getScheduleCall(){

    this.httpClient.get <ScheduleModel[]>(`${this.URL}/delivery`).subscribe(items => {
    
      this.transferState.set(this.SCHEDULE_KEY, items);
      this.schedule$.next(items);
                
    });

  }

  getDeliveryDate(deliveryId:number,price:number){

    this.httpClient.get <DeliveryModel>(`${this.URL}/delivery/${deliveryId}/${price}`).subscribe(item => {
    
      this.$deliveryData.set(item);
                
    });

  }

  

}
