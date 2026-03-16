import { Component, effect, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { ShippingBusiness } from '@models/shippingBusiness.model';
import { OrderService } from '@services/order.service';
import { ShippingBusinessService } from '@services/shipping-business.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-shipping-method',
    templateUrl: './shipping-method.component.html',
    styleUrl: './shipping-method.component.scss',
    standalone: false
})
export class ShippingMethodComponent implements OnDestroy, OnInit{
  
  private shippingBusinessService = inject(ShippingBusinessService);
  //ships:ShippingBusiness[] = [];
  ships = this.shippingBusinessService.shippingMethodsSignal;

  @Output() methodSelected = new EventEmitter<ShippingBusiness>();
  selectedAccordionId: number = 1; // ID del primer elemento por defecto.

  //destroyShippingBusiness?:Subscription;
  destroyLastOrder?:Subscription;

  constructor(private orderService:OrderService){
    
    effect(()=>{

        if(this.ships().length>0){

          this.selectMethod(this.ships()[0]);
          /*this.destroyLastOrder = this.orderService.lastOrder.subscribe( lastOrder => {
      
            this.ships().forEach( ship =>{
            
              if(ship.id===lastOrder.business_shiping_id){
                this.selectMethod(ship);
                return;
              }
            });
          
          });*/
        }
        
    });

    this.shippingBusinessService.getShippingMetphods();
  }

  ngOnInit(): void {

    /*this.destroyShippingBusiness = this.shippingBusinessService.shippingMethods.subscribe(items=>{
      
      if(items){
        this.ships = items;
        this.selectMethod(this.ships[0]);

        this.destroyLastOrder = this.orderService.lastOrder.subscribe( lastOrder => {
      
          this.ships.forEach( ship =>{
            
            if(ship.id===lastOrder.business_shiping_id){
              this.selectMethod(ship);
              return;
            }
          })
          
        });
      }

    });*/


    
   
  }
  ngOnDestroy(): void {

    //if(this.destroyShippingBusiness)
      //this.destroyShippingBusiness.unsubscribe();
    if(this.destroyLastOrder)
      this.destroyLastOrder.unsubscribe();

  }

  selectMethod(method: ShippingBusiness) {
    this.selectedAccordionId = method.id;
    this.methodSelected.emit(method);
  }

}
