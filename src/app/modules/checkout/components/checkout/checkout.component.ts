import { Component, computed, effect, inject, Inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CartModel } from '@models/cart.model';
import { DeliveryScheduleSlot } from '@models/deliverySchedule.model';
import { PaymentModel } from '@models/payment.model';
import { PickupLocationModel } from '@models/pickupLocation.model';
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
  private destroyAvailabilityError?:Subscription;
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
  step1Error = signal<string>('');
  orderErrorMessage = signal<string>('');

  // Tipo 1: Retiro en tienda
  selectedPickupLocation: PickupLocationModel | null = null;
  selectedPickupLocationId: number | string | null = null;

  // Tipo 4: Despacho programado
  selectedDeliveryDate: string = '';
  selectedDeliverySlot: DeliveryScheduleSlot | null = null;
  selectedDeliverySlotId: number | string | null = null;
  
  //step2
  selectedPaymentMethodSignal = signal<PaymentModel>({} as PaymentModel);
  get selectedPaymentMethod(): PaymentModel {
    return this.selectedPaymentMethodSignal();
  }
  set selectedPaymentMethod(val: PaymentModel) {
    this.selectedPaymentMethodSignal.set(val);
  }
  isSubmitting = false;

  paymentsMethodsSignal = this.paymentService.paymentsMethodsSignal;

  isPaymentReady = computed(() => {
    const methods = this.paymentsMethodsSignal();
    const hasMethods = methods && methods.length > 0;
    const selected = this.selectedPaymentMethodSignal();
    const hasSelectedMethod = !!(selected && selected.id != null);
    const hasTotal = this.totalOrderPrice() !== undefined && this.totalOrderPrice() !== null;
    return hasMethods && hasSelectedMethod && hasTotal;
  });

  //amount
  private orderService = inject(OrderService);
  amountModel = this.orderService.totalAmountSignal;
  applyDiscountText = computed(()=> (this.amountModel().disc_text)?this.amountModel().disc_text:'');
  disc_amount = computed(()=> (this.amountModel().disc_amount!=undefined)?this.amountModel().disc_amount:0);
  discountValue = computed(()=> (this.amountModel().disc_percentage!=undefined)?this.amountModel().disc_percentage:0.1);
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
    if(this.destroyAvailabilityError)
      this.destroyAvailabilityError.unsubscribe();
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
      if (this.cart().id != undefined && this.selectedShippingMethod.id != undefined) {
        this.orderService.getTotalAmount(this.cart().id, this.selectedShippingMethod.id);
        this.paymentService.getPayments();
      }
    });


    this.destroyLastOrder = this.orderService.lastOrder.subscribe( lastOrder => {

      if(lastOrder.shipping_address_id!= undefined && this.currentStep==1){
        // Solo avanzar automáticamente si el método de la última compra fue Tipo 2 (Despacho a Domicilio Local tradicional)
        const shippingMethods = this.shippingBusinessService.shippingMethodsSignal();
        const matchedMethod = shippingMethods.find(m => m.id === lastOrder.business_shiping_id);
        const isLocalDelivery = matchedMethod
          ? (matchedMethod.shipping_type_id === 2 || matchedMethod.shipping_type === 'local_delivery' || (!matchedMethod.shipping_type_id && !matchedMethod.shipping_type))
          : false;

        if (isLocalDelivery) {
          this.currentStep++;
        }
      }

    });

    this.destroyAvailabilityError = this.orderService.orderAvailabilityError.subscribe(errMsg => {
      this.orderErrorMessage.set(errMsg);
    });

    this.destroyPostOk = this.orderService.postOk.subscribe(postOk => {
      this.isSubmitting = postOk;
    });


    
  }


  //select shippingMetdod
  selectedShippingMethodFunc($event:ShippingBusiness){
    
    this.selectedShippingMethod = $event;
    this.orderErrorMessage.set('');
    //console.log('sub_total_price: ', this.cart().id);
    if(this.cart().id!=undefined && this.sub_total_price()!=undefined)
      this.shippingBusinessService.getCost(this.cart().id, this.selectedShippingMethod.id, this.sub_total_price());
  }

  isStorePickup(): boolean {
    return this.selectedShippingMethod?.shipping_type_id === 1 || this.selectedShippingMethod?.shipping_type === 'store_pickup';
  }

  isScheduledDelivery(): boolean {
    return this.selectedShippingMethod?.shipping_type_id === 4 || this.selectedShippingMethod?.shipping_type === 'scheduled_local_delivery';
  }

  onPickupLocationSelected(location: PickupLocationModel): void {
    this.selectedPickupLocation = location;
    this.selectedPickupLocationId = location.id;
  }

  onDeliveryScheduleSelected(event: { date: string; slot: DeliveryScheduleSlot }): void {
    this.selectedDeliveryDate = event.date;
    this.selectedDeliverySlot = event.slot;
    this.selectedDeliverySlotId = event.slot.id;
  }

  next(){
    if(this.currentStep==1){
      this.orderErrorMessage.set('');

      if (!this.selectedShippingMethod || this.selectedShippingMethod.id === undefined || this.selectedShippingMethod.id === -1) {
        this.step1Error.set('Por favor seleccione un método de envío.');
        return;
      }

      // Tipo 1: Retiro en tienda
      if (this.isStorePickup()) {
        if (!this.selectedPickupLocationId) {
          this.step1Error.set('Por favor seleccione un punto de retiro.');
          return;
        }
        if (!this.whatsappNumber || this.whatsappNumber.trim() === '') {
          this.step1Error.set('Por favor ingrese un teléfono de contacto / WhatsApp.');
          return;
        }
      } else {
        // Tipos 2 y 4: Despacho a domicilio
        if (!this.selectedAddress || this.selectedAddress === '') {
          this.step1Error.set('Por favor seleccione o ingrese una dirección de despacho.');
          return;
        }

        // Tipo 4: Despacho programado
        if (this.isScheduledDelivery()) {
          if (!this.selectedDeliveryDate || !this.selectedDeliverySlotId) {
            this.step1Error.set('Por favor seleccione una fecha y franja horaria para la entrega.');
            return;
          }
        }

        if (!this.whatsappNumber || this.whatsappNumber.trim() === '') {
          this.step1Error.set('Por favor ingrese un teléfono de contacto / WhatsApp.');
          return;
        }
      }

      this.step1Error.set('');
      this.currentStep++;
      this.scrollToTop();
    }
  }

  back(){
    this.currentStep--;
    this.scrollToTop();
  }

  gotoPayment(){
    
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.orderErrorMessage.set('');

    if (this.isStorePickup()) {
      // Tipo 1: Retiro en tienda
      this.orderService.storeOrder(
        this.cart().id,
        null,
        this.selectedShippingMethod.id,
        this.selectedPaymentMethod,
        this.whatsappNumber,
        {
          pickup_location_id: this.selectedPickupLocationId
        }
      );
    } else if (this.isScheduledDelivery()) {
      // Tipo 4: Despacho programado
      this.orderService.storeOrder(
        this.cart().id,
        this.selectedAddress,
        this.selectedShippingMethod.id,
        this.selectedPaymentMethod,
        this.whatsappNumber,
        {
          delivery_date: this.selectedDeliveryDate,
          time_slot_id: this.selectedDeliverySlotId!
        }
      );
    } else {
      // Tipo 2: Despacho tradicional
      this.orderService.storeOrder(
        this.cart().id,
        this.selectedAddress,
        this.selectedShippingMethod.id,
        this.selectedPaymentMethod,
        this.whatsappNumber
      );
    }
  }

  getPaymentMethod($event:PaymentModel){
    this.selectedPaymentMethodSignal.set($event);
  }

  setSelectedAddress(event:ShippingAddress){
    this.shippingAddress = event;
    this.selectedAddress = event.id;

    if (this.cart().id != undefined && this.selectedShippingMethod.id != undefined && this.sub_total_price() != undefined) {
      this.shippingBusinessService.getCost(this.cart().id, this.selectedShippingMethod.id, this.sub_total_price());
      this.orderService.getTotalAmount(this.cart().id, this.selectedShippingMethod.id);
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private calculateTotalProce():void{
    if(this.cart().id!=undefined && this.selectedShippingMethod.id!=undefined){
      this.shippingBusinessService.getCost(this.cart().id, this.selectedShippingMethod.id, this.sub_total_price());
      this.orderService.getTotalAmount(this.cart().id, this.selectedShippingMethod.id);
      this.paymentService.getPayments();
    }
  }
  
}
