import { Component, inject, Input } from '@angular/core';
import { DeliveryScheduleSlot } from '@models/deliverySchedule.model';
import { PickupLocationModel } from '@models/pickupLocation.model';
import { ShippingAddress } from '@models/shippingAddress.model';
import { ShippingBusiness } from '@models/shippingBusiness.model';
import { CartService } from '@services/cart.service';
import { DeliveryService } from '@services/delivery.service';


@Component({
    selector: 'app-purchase-detail',
    templateUrl: './purchase-detail.component.html',
    styleUrl: './purchase-detail.component.scss',
    standalone: false
})
export class PurchaseDetailComponent {

 //@Input('cart') cart:CartModel = {} as CartModel;
 @Input('sub_total_price') sub_total_price:number = 0;
 @Input('shipping_price') shipping_price:number = 0;
 @Input('shippingBusiness') shippingBusiness: ShippingBusiness =  {} as ShippingBusiness;
 @Input('discountValue') discountValue:number=0;
 @Input('applyDiscountText') applyDiscountText:string="";
 @Input('disc_amount') disc_amount:number=0;
 @Input('totalOrderPrice') totalOrderPrice:number = 0;
 @Input('shippingAddress') shipingAddress:ShippingAddress = {} as ShippingAddress;
 @Input('contact') contact:string = '';
 @Input('pickupLocation') pickupLocation: PickupLocationModel | null = null;
 @Input('selectedDeliveryDate') selectedDeliveryDate: string = '';
 @Input('selectedDeliverySlot') selectedDeliverySlot: DeliveryScheduleSlot | null = null;

 private deliveryService = inject(DeliveryService);
 deliveryData = this.deliveryService.deliveryDataSignal;

 private cartService = inject(CartService);
 cart = this.cartService.$currentCartSignal;

 extraerValor(texto: string): string {
    return this.cartService.extraerDatoVariant(texto);
  }

  isStorePickup(): boolean {
    return this.shippingBusiness?.shipping_type_id === 1 || this.shippingBusiness?.shipping_type === 'store_pickup';
  }

  isScheduledDelivery(): boolean {
    return this.shippingBusiness?.shipping_type_id === 4 || this.shippingBusiness?.shipping_type === 'scheduled_local_delivery';
  }

  formatSlotTime(slot: DeliveryScheduleSlot | null): string {
    if (!slot) return '';
    const start = (slot.start_time || '').slice(0, 5);
    const end = (slot.end_time || '').slice(0, 5);
    return `${start} - ${end}`;
  }
}
