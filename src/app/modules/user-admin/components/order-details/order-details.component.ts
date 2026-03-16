import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { OrderModel } from '@models/order.model';
import { OrderDiscountModel } from '@models/orderDiscount.model';
import { OrderService } from '@services/order.service';
import { Subscription } from 'rxjs';


@Component({
    selector: 'app-order-details',
    templateUrl: './order-details.component.html',
    styleUrl: './order-details.component.scss',
    standalone: false
})
export class OrderDetailsComponent implements OnChanges, OnInit, OnDestroy{

  @Input('order') order:OrderModel = {} as OrderModel;
  @Output() isShowDetails  = new EventEmitter<boolean>();
  originalPrice:number = 0;
  orderDiscountModel:OrderDiscountModel[] = [];

  destroyOrder?:Subscription;

  constructor(private orderService:OrderService){}

  ngOnDestroy(): void {

    if(this.destroyOrder)
      this.destroyOrder.unsubscribe();

  }
  
  ngOnInit(): void {

    this.destroyOrder = this.orderService.orderDiscount.subscribe(item => {
      //console.log(item);
      this.orderDiscountModel = item;
    });
    
  }

  ngOnChanges(changes: SimpleChanges): void {
    
    if(changes['order'].currentValue!=undefined && !changes['order'].firstChange){
      this.orderService.getOrderDiscount(changes['order'].currentValue.id);
      this.originalPrice=0;
      this.getTotal(changes['order'].currentValue)
    }

  }

  back(){
    this.isShowDetails.emit(false);
  }

  getTotal(order:OrderModel){
    for(let item of order.items){
      this.originalPrice+=item.quantity*item.price;
    }
  }
}
