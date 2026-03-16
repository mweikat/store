import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { OrderModel } from '@models/order.model';
import { OrderShippedModel } from '@models/orderShipped.model';
import { OrderService } from '@services/order.service';
import { Subscription } from 'rxjs';
import { OrderDetailsComponent } from '../order-details/order-details.component';


@Component({
    selector: 'app-orders',
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss',
    standalone: false
})
export class OrdersComponent implements OnInit, OnDestroy {

  @ViewChild(OrderDetailsComponent) detailsComponent!: OrderDetailsComponent;

  destroyOrderList?:Subscription;
  destroyDetailsOrder?:Subscription;
  destroyShippedOrder?:Subscription;

  orders: OrderModel[] = [];
  orderSelected:OrderModel = {} as OrderModel;
  showDetails:boolean = false;

  constructor(private orderService:OrderService){

    this.orderService.getMyOrderList();
  }

  ngOnDestroy(): void {
    if(this.destroyOrderList)
      this.destroyOrderList.unsubscribe();
    if(this.destroyDetailsOrder)
      this.destroyDetailsOrder.unsubscribe();
    if(this.destroyShippedOrder)
      this.destroyShippedOrder.unsubscribe();
  }

  ngOnInit(): void {
   
    this.destroyOrderList = this.orderService.myOrders.subscribe( orders => {
      this.orders = orders;
    });

    this.destroyDetailsOrder = this.orderService.orderDetails.subscribe( ordersItems =>{
      if(ordersItems!=undefined && ordersItems.length>0)
        this.orderSelected.items = ordersItems;
    });

    this.destroyShippedOrder = this.orderService.orderShipped.subscribe(shipped =>{
      if(shipped != undefined)
        this.orderSelected.shipped = shipped;
    });

  }

  toggleDetails(order: OrderModel): void {
    
    this.orderService.getOrderDetails(order.id);
    this.orderService.getShippedOrder(order.id);
    this.orderSelected = {...order};
    this.showDetails = true;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'badge-success';
      case 'PENDING':
        return 'badge-warning';
      case 'PAID':
          return 'badge-success';
      case 'PENDING_VERIFICATION':
            return 'badge-warning';
      case 'SHIPPED':
          return 'badge-success';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return '';
    }
  }

  // En tu componente
  getTrackId(item: any, index: number): string {
    return item.id || 
          item.product_id || 
          `${index}-${item.name || 'item'}`;
  }

  hideDetails(){
    this.showDetails = false;
  }
}
