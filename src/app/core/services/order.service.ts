import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState, DOCUMENT } from '@angular/core';
import { ProductNStockError } from '@models/error/productNStockError.model';
import { OrderModel } from '@models/order.model';
import { OrderDiscountModel } from '@models/orderDiscount.model';
import { OrderItemModel } from '@models/orderItem.model';
import { OrderIteratePurchase } from '@models/orderIteratePurchase.model';
import { OrderLastModel } from '@models/orderLast.model';
import { OrderShippedModel } from '@models/orderShipped.model';
import { OrderTotalAmountModel } from '@models/orderTotalAmount.model';
import { PaymentModel } from '@models/payment.model';
import { CartService } from '@services/cart.service';
import { PaymentProcessorService } from '@services/payment-processor.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private URL = environment.api_order;

  private $totalAmount = signal<OrderTotalAmountModel>({} as OrderTotalAmountModel);
  public readonly totalAmountSignal = this.$totalAmount.asReadonly(); 

  private readonly orderNumberData$: Subject<any> = new Subject();
  public readonly orderNumberData: Observable<any> = this.orderNumberData$.asObservable();

  private readonly noStockError$: Subject<ProductNStockError> = new Subject();
  public readonly noStockError: Observable<ProductNStockError> = this.noStockError$.asObservable();

  private readonly paymentError$: Subject<boolean> = new Subject();
  public readonly paymentError: Observable<boolean> = this.paymentError$.asObservable();

  private readonly MY_ORDERS = makeStateKey<any>('myorders');
  private readonly myOrders$: Subject<any> = new Subject();
  public readonly myOrders: Observable<any> = this.myOrders$.asObservable();

  private readonly orderDetails$: Subject<OrderItemModel[]> = new Subject();
  public readonly orderDetails: Observable<OrderItemModel[]> = this.orderDetails$.asObservable();

  private readonly orderDiscount$: Subject<OrderDiscountModel[]> = new Subject();
  public readonly orderDiscount: Observable<OrderDiscountModel[]> = this.orderDiscount$.asObservable();

  private readonly orderShipped$: Subject<OrderShippedModel> = new Subject();
  public readonly orderShipped: Observable<OrderShippedModel> = this.orderShipped$.asObservable();

  private readonly lastOrder$: BehaviorSubject<OrderLastModel> = new BehaviorSubject({} as OrderLastModel);
  //private readonly lastOrder$: Subject<OrderLastModel> = new Subject();
  public readonly lastOrder: Observable<OrderLastModel> = this.lastOrder$.asObservable();

  private readonly postOk$: Subject<boolean> = new Subject();
  public readonly postOk: Observable<boolean> = this.postOk$.asObservable();

  private $discountIterative = signal<OrderIteratePurchase>({} as OrderIteratePurchase);
  public readonly discountIterativeSignal = this.$discountIterative.asReadonly();

  noStockErrorModel:ProductNStockError = {} as ProductNStockError;

  constructor(
    private httpClient: HttpClient,
    @Inject(DOCUMENT) private document: Document,
    private transferState: TransferState,
    @Inject(PLATFORM_ID) private platformId: Object,
    private paymentProcessorService: PaymentProcessorService,
    private cartService: CartService
  ) { }

  getTotalAmount(cartId:string, businessShippingId:number){

    let termToJson = {cartId:cartId,shippingBusinessId:businessShippingId};

    this.httpClient.post<OrderTotalAmountModel>(`${this.URL}/total-amount`,termToJson).subscribe(item => {
      this.$totalAmount.set(item);
    });

  }

  storeOrder(cartId:string, shipping_id:string, business_shipping_id:number, payment:PaymentModel, contact:string){

    let toJson = {
      "business_shipping_id": business_shipping_id,
      "cart_id":cartId,
      "shipping_id":shipping_id,
      "payment_id":payment.id,
      "contact":contact
    }

    this.httpClient.post<any>(`${this.URL}`,toJson,{observe: 'response', responseType: 'json'}).subscribe({
      next: (item) => {
        const outcome = this.paymentProcessorService.processPaymentResponse(payment, item.body);
        if (outcome.success) {
          this.cartService.clearCart();
          this.paymentProcessorService.executeNavigation(outcome);
        } else {
          this.paymentError$.next(true);
          this.postOk$.next(false);
        }
      },
      error: (err) => {
        if(err.status==422){
          this.noStockErrorModel = err.error[0];
          this.noStockError$.next(this.noStockErrorModel);
        }
        
        if(err.status==402){
          this.paymentError$.next(true);
        } else if (err.status !== 422) {
          this.paymentError$.next(true);
        }

        this.postOk$.next(false);
      }
    });

  }

  getOrderconfirm(orderNum:string){

    if(isPlatformBrowser(this.platformId)){

      let toJson = {orderNum:orderNum};

      this.httpClient.post<any>(`${this.URL}/confirm`,toJson,{observe: 'response', responseType: 'json'}).subscribe(item => {

        this.orderNumberData$.next(item);

      });
    }

  }

  /*getOrderDetails(order_id:string){

    this.httpClient.get<OrderItemModel[]>(`${this.URL}/details/${order_id}`).subscribe(items => {
      
      this.orderDetails$.next(items);

    });

  }*/

  getOrderDiscount(order_id:string){

    this.httpClient.get<OrderDiscountModel[]>(`${this.URL}/details-discount/${order_id}`).subscribe(items => {
      
      this.orderDiscount$.next(items);

    });

  }

  getShippedOrder(order_id:string){

    this.httpClient.get<OrderShippedModel>(`${this.URL}/shipped/${order_id}`).subscribe(items => {
      
      this.orderShipped$.next(items);

    });

  }

  getMyOrderList(page: number = 1, perPage: number = 10, sort: string = 'created_at', direction: string = 'desc'){

    if(isPlatformBrowser(this.platformId)){

      const cachedOrders = this.transferState.get(this.MY_ORDERS, null);
              
      if(cachedOrders && Array.isArray(cachedOrders) && cachedOrders.length > 0 && page === 1 && sort === 'created_at' && direction === 'desc'){
        this.myOrders$.next(cachedOrders);
        this.transferState.remove(this.MY_ORDERS);
      }
      else{
        this.getMyOrderListCall(page, perPage, sort, direction);
      }
    }

  }

  private getMyOrderListCall(page: number = 1, perPage: number = 10, sort: string = 'created_at', direction: string = 'desc'){
    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString())
      .set('sort', sort)
      .set('direction', direction);

    this.httpClient.get<any>(`${this.URL}`, { params }).subscribe({
      next: (items) => {
        this.myOrders$.next(items);
        if (page === 1) {
          this.transferState.set(this.MY_ORDERS, items);
        }
      },
      error: (err) => {
        console.error('Error fetching order list:', err);
      }
    });
  }

  getLastOrder(){
    
    if(isPlatformBrowser(this.platformId)){

      this.httpClient.get<OrderLastModel>(`${this.URL}/last-order`).subscribe(items => {
      
        this.lastOrder$.next(items);
       
  
      });

    }
  }

  getDiscountOrderIterative(){

    if(isPlatformBrowser(this.platformId)){

      this.httpClient.get<OrderIteratePurchase>(`${this.URL}/iterative-purchasing-count`).subscribe(item => {
        
        this.$discountIterative.set(item);
       
  
      });

    }

  }


}
