import { AfterViewInit, Component, computed, effect, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DiscountService } from '@services/discount.service';
import { OrderService } from '@services/order.service';

@Component({
  selector: 'app-order-iterate-purchase',
  standalone: false,
  templateUrl: './order-iterate-purchase.component.html',
  styleUrl: './order-iterate-purchase.component.scss'
})
export class OrderIteratePurchaseComponent implements OnChanges{

  @Input('totalOrderPrice') totalOrderPrice:number=0;
  private discountService = inject(DiscountService);
  private orderService = inject(OrderService);
  private called = false;

  discountIterate = this.orderService.discountIterativeSignal;
  activeDiscounts = this.discountService.discountsSignal;

  isInterateActive = computed(() => {
    const discounts = this.activeDiscounts() ?? [];
    return discounts.some(d => d.discount_type_id === 3);
  });

  isAmountCorrect:boolean =false;

  flag2 = computed(()=>{
    return this.discountIterate().status!=undefined? true: false;
  });

  constructor(){
    this.discountService.getActiveDiscounts();

    effect(() => {
      if (this.isInterateActive() && !this.called) {
        this.called = true;
        this.orderService.getDiscountOrderIterative();
      }
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    
    if(changes['totalOrderPrice'].currentValue!=undefined){
      
      if(this.totalOrderPrice!=undefined){
        const discountType3 = this.activeDiscounts().find(d => d.discount_type_id === 3);
        
        if(discountType3 && discountType3?.min_amount<=this.totalOrderPrice){
          this.isAmountCorrect=true;

        }else{
          this.isAmountCorrect=false;
        }
      }
    }

  }


 

}

