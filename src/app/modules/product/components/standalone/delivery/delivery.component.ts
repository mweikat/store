import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeliveryModel } from '@models/delivery.model';
import { DeliveryService } from '@services/delivery.service';
import { ShippingBusinessService } from '@services/shipping-business.service';

@Component({
  selector: 'app-delivery',
  imports: [FormsModule],
  templateUrl: './delivery.component.html',
  styleUrl: './delivery.component.scss',
})
export class DeliveryComponent {

  private businessShippingService = inject(ShippingBusinessService);
  shippingMehtods = this.businessShippingService.shippingMethodsSignal;
  price = input.required<number>();

  deliveryService = inject(DeliveryService);
  deliveryData = this.deliveryService.deliveryDataSignal;

  localDeliveryData = signal<DeliveryModel | null>(null);
  methodSelected:number=0;
  isShowMethod = computed(() => this.localDeliveryData() !== null);

  constructor() {
    
    effect(() => {
      if(this.price()>0){
        this.businessShippingService.getShippingMetphods();
        this.getDelivery();
      }
      
    });

    effect(() => {

      const delivery = this.deliveryData();

      if (delivery?.name) {
        this.localDeliveryData.set(delivery);
      }

    });

  }

  getDelivery(){

    if(this.methodSelected!=0){
      //let price = (this.product().priceSale)?this.product().priceSale:this.product().price;

      this.deliveryService.getDeliveryDate(this.methodSelected,this.price());
    }else
      this.hideDeliveryData();
   
  }

  private hideDeliveryData() {
    this.localDeliveryData.set(null);
  }
}
