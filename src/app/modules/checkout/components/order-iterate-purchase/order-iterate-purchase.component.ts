import { AfterViewInit, Component, computed, effect, inject, input, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DiscountService } from '@services/discount.service';
import { OrderService } from '@services/order.service';

@Component({
  selector: 'app-order-iterate-purchase',
  standalone: false,
  templateUrl: './order-iterate-purchase.component.html',
  styleUrl: './order-iterate-purchase.component.scss'
})
export class OrderIteratePurchaseComponent{

  //@Input('totalOrderPrice') totalOrderPrice:number=0;
  totalOrderPrice = input.required<number>();
  private discountService = inject(DiscountService);
  private orderService = inject(OrderService);
  private called = false;

  discountIterate = this.orderService.discountIterativeSignal;
  activeDiscounts = this.discountService.discountsSignal;

  isIterateActive = computed(() => {
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
      if (this.isIterateActive() && !this.called) {
        this.called = true;
        this.orderService.getDiscountOrderIterative();
      }
    });

    effect(()=>{
      if(this.activeDiscounts()!=undefined && this.totalOrderPrice()!=0){
        //console.log("active discount: ", this.activeDiscounts());
        this.calculateShowIterativeDiscount();
      }
    });
  }
  /*ngOnChanges(changes: SimpleChanges): void {
    
    if(changes['totalOrderPrice'].currentValue!=undefined){
      
      if(this.totalOrderPrice!=undefined){
        

        const discountType3 = this.activeDiscounts().find(d => d.discount_type_id === 3);
        
        if(discountType3 && discountType3?.min_amount<=this.totalOrderPrice){
          this.isAmountCorrect=true;

        }else{
          this.isAmountCorrect=false;
        }
        console.log("discountType3 ", discountType3);
        console.log("amount: ", this.isAmountCorrect);
        console.log("iterative : ", this.isIterateActive());
        console.log("total: ",this.totalOrderPrice);
      }
      //this.calculateShowIterativeDiscount();
    }

  }*/

  private calculateShowIterativeDiscount(){

    if(this.totalOrderPrice!=undefined){

        const discountType3 = this.activeDiscounts().find(d => d.discount_type_id === 3);
        
        if(discountType3 && discountType3?.min_amount<=this.totalOrderPrice()){
          this.isAmountCorrect=true;

        }else{
          this.isAmountCorrect=false;
        }
        /*console.log("discountType3 ", discountType3);
        console.log("amount: ", this.isAmountCorrect);
        console.log("iterative : ", this.isIterateActive());
        console.log("total: ",this.totalOrderPrice);*/
    }

  }
 

}

