import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '@services/cart.service';
import { OrderService } from '@services/order.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-confirm',
    templateUrl: './confirm.component.html',
    styleUrl: './confirm.component.scss',
    standalone: false
})
export class ConfirmComponent implements OnInit,OnDestroy{

  orderNum:string|null="";
  message:string = "";
  orderStatus:string = "";
  isSuccess:boolean = true;
  isLoading:boolean = true;

  destroyRoute?:Subscription;
  destroyOrder?:Subscription;

  constructor(
    private orderService:OrderService,
    private route: ActivatedRoute,
    private cartService: CartService
  ){}

  ngOnInit(): void {

    this.destroyRoute = this.route.paramMap.subscribe(params => {
      this.orderNum = params.get('orderNum');
      if(this.orderNum)
        this.orderService.getOrderconfirm(this.orderNum);
    });

    this.destroyOrder = this.orderService.orderNumberData.subscribe(data => {
      this.isLoading = false;
      const body = data?.body;
      if (body) {
        this.message = body.message || "";
        this.orderStatus = (body.status || body.order_status || body.order?.status || "").toUpperCase();

        const invalidStatuses = ['CANCELLED', 'CANCELED', 'REJECTED', 'FAILED', 'INVALID', 'ERROR'];
        if (invalidStatuses.includes(this.orderStatus) || body.success === false) {
          this.isSuccess = false;
        } else {
          this.isSuccess = true;
          this.cartService.clearCart();
        }
      }
    });
    
  }

  ngOnDestroy(): void {
    if(this.destroyRoute)
      this.destroyRoute.unsubscribe();
    if(this.destroyOrder)
      this.destroyOrder.unsubscribe();
  }

  
  
}
