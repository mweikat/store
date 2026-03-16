import { Component, computed, effect, inject, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CartModel } from '@models/cart.model';
import { PaymentModel } from '@models/payment.model';
import { ShippingAddress } from '@models/shippingAddress.model';
import { ShippingBusiness } from '@models/shippingBusiness.model';
import { CartService } from '@services/cart.service';
import { DeliveryService } from '@services/delivery.service';
import { OrderService } from '@services/order.service';
import { PaymentService } from '@services/payment.service';
import { SeoService } from '@services/seo.service';
import { ShippingBusinessService } from '@services/shipping-business.service';
import { distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';

@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.component.html',
    styleUrl: './checkout.component.scss',
    standalone: false
})
export class CheckoutComponent implements OnInit, OnDestroy{

  //services
  private paymentService = inject(PaymentService);  
  private seoService  = inject(SeoService);
  private shippingBusinessService = inject(ShippingBusinessService);
  private deliveryService = inject(DeliveryService);
  
  //destroys
  private destroyShipBusiness?:Subscription;
  private destroyLastOrder?:Subscription;
  private destroyPostOk?:Subscription;
  private destroy$ = new Subject<void>();
  private destroy2$ = new Subject<void>();

  //cart
  private cartService = inject(CartService);
  sub_total_price = this.cartService.totalPriceCartSignal;
  cart = this.cartService.$currentCartSignal;
    
  //stepers and user
  currentStep:number = 0;
  
  //step 1
  selectedShippingMethod:ShippingBusiness = {} as ShippingBusiness;
  selectedAddress = '';
  whatsappNumber = '';
  shipping_price:number = 0;
  shippingAddress:ShippingAddress = {} as ShippingAddress;
  
  //step2
  selectedPaymentMethod:PaymentModel = {} as PaymentModel;
  isSubmitting = false;

    
  //amount
  private orderService = inject(OrderService);
  amountModel = this.orderService.totalAmountSignal;
  applyDiscountText = computed(()=> (this.amountModel().disc_text)?this.amountModel().disc_text:'');
  disc_amount = computed(()=> (this.amountModel().disc_amount!=undefined)?this.amountModel().disc_amount:0);
  discountValue = computed(()=> (this.amountModel().disc_percentage!=undefined)?this.amountModel().disc_percentage:0.1);
  ;
  totalOrderPrice = computed(()=> this.amountModel().total_amount);

  constructor(){

    this.orderService.getLastOrder();
    this.seoService.setIndexFallow(false);
    this.cartService.getCart();
    this.currentStep = 1;

    //signals to suscribe
    const cartObs$ = toObservable(this.cart);
    const aomuntObs$ = toObservable(this.amountModel);
    
    // Nos suscribimos al observable
    cartObs$.pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)), // Evita llamadas duplicadas para el mismo valor, comparando los valores
      takeUntil(this.destroy$) // Se completa cuando destroy$ emite
    ).subscribe(value => {
      
      if(value.items!=undefined && value.items.length>0){
        this.cartService.getTotalPriceCartCart();
        this.calculateTotalProce();
      }
    });

    aomuntObs$.pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)), // Evita llamadas duplicadas para el mismo valor, comparando los valores
      takeUntil(this.destroy2$) 
    ).subscribe(value => {

      if(this.selectedShippingMethod.id!=undefined && value!=undefined){
        this.deliveryService.getDeliveryDate(this.selectedShippingMethod.id,this.totalOrderPrice()); 
      }
    });
    
    
  }

  ngOnDestroy(): void {

    if(this.destroyShipBusiness)
      this.destroyShipBusiness.unsubscribe();
    if(this.destroyLastOrder)
      this.destroyLastOrder.unsubscribe();
    if(this.destroyPostOk)
      this.destroyPostOk.unsubscribe();
    this.destroy$.next(); 
    this.destroy$.complete(); 
    this.destroy2$.next(); 
    this.destroy2$.complete(); 

  }

  ngOnInit(): void {

    this.destroyShipBusiness = this.shippingBusinessService.shippingCost.subscribe(price=>{
      this.shipping_price = price;
      this.calculateTotalProce();
      
    });


    this.destroyLastOrder = this.orderService.lastOrder.subscribe( lastOrder => {

      if(lastOrder.shipping_address_id!= undefined && this.currentStep==1){
        this.currentStep++;
      }

    });

    this.destroyPostOk = this.orderService.postOk.subscribe(postOk => {
      this.isSubmitting = postOk;
    });


    
  }


  //select shippingMetdod
  selectedShippingMethodFunc($event:ShippingBusiness){
    
    this.selectedShippingMethod = $event
    if(this.cart().id!=undefined)
      this.shippingBusinessService.getCost(this.cart().id, this.selectedShippingMethod.id);
  }

  next(){
   
    if(this.currentStep==1){
      
      if (this.selectedShippingMethod.id!=-1 && this.selectedAddress!='' && this.selectedAddress!=undefined && this.whatsappNumber!=''){
        this.currentStep++;
        this.scrollToTop();
      }
    }
  }

  back(){
    this.currentStep--;
    this.scrollToTop();
  }

  gotoPayment(){
    
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    this.orderService.storeOrder(this.cart().id, this.selectedAddress, this.selectedShippingMethod.id, this.selectedPaymentMethod, this.whatsappNumber);
  }

  getPaymentMethod($event:PaymentModel){
    this.selectedPaymentMethod = $event;
  }

  setSelectedAddress(event:ShippingAddress){
    this.shippingAddress = event;
    this.selectedAddress = event.id;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private calculateTotalProce():void{
    if(this.cart().id!=undefined && this.selectedShippingMethod.id!=undefined){
      this.orderService.getTotalAmount(this.cart().id, this.selectedShippingMethod.id);
      this.paymentService.getPayments();
    }
  }
  
}
