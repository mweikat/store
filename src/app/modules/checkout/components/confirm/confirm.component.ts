import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

  destroyRoute?:Subscription;
  destroyOrder?:Subscription;

  constructor(private orderService:OrderService, private route: ActivatedRoute,){}

  ngOnInit(): void {

    this.destroyRoute = this.route.paramMap.subscribe(params => {
      this.orderNum = params.get('orderNum');
      if(this.orderNum)
        this.orderService.getOrderconfirm(this.orderNum);
    });

    this.destroyOrder = this.orderService.orderNumberData.subscribe(data => {
      this.message = data.body.message;
    });
    
  }

  ngOnDestroy(): void {
    if(this.destroyRoute)
      this.destroyRoute.unsubscribe();
    if(this.destroyOrder)
      this.destroyOrder.unsubscribe();
  }

  
  
}
