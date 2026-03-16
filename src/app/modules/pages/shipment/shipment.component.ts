import { Component, OnDestroy, OnInit } from '@angular/core';
import { ScheduleModel } from '@models/schedule.model';
import { DeliveryService } from '@services/delivery.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-shipment',
    templateUrl: './shipment.component.html',
    styleUrl: './shipment.component.scss',
    standalone: false
})
export class ShipmentComponent implements OnInit, OnDestroy {

  scheduleModel:ScheduleModel[] = [];

  destroySchedule?:Subscription;
  
  constructor(private deliveryService:DeliveryService) {
    this.deliveryService.getSchedule();
   }
  ngOnDestroy(): void {
    if(this.destroySchedule)
      this.destroySchedule.unsubscribe();
  }

  ngOnInit() {

      this.destroySchedule = this.deliveryService.schedule.subscribe(itms => {
        if(itms.length>0)
          this.scheduleModel = itms;
      });

      
  }
}