import { Component, effect, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { PaymentModel } from '@models/payment.model';
import { OrderService } from '@services/order.service';
import { PaymentService } from '@services/payment.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-payment',
    templateUrl: './payment.component.html',
    styleUrl: './payment.component.scss',
    standalone: false
})
export class PaymentComponent implements OnInit, OnDestroy{

  private paymentService = inject(PaymentService);
  payments = this.paymentService.paymentsMethodsSignal;


  @Output() paymentSelected = new EventEmitter<PaymentModel>();
  selectedAccordionId: number = 1;
  

  //destroyPayments?:Subscription;
  destroyError?:Subscription;
  destroyLastOrder?:Subscription;

  errorPayment:boolean = false;

  constructor(private orderService:OrderService){
    
    effect(()=>{
      //console.log('entra cuando cambia ', this.payments());
      if(this.payments().length>0){
        
        this.selectedAccordionId = this.payments()[0].id;
        this.selectPaymentMethod(this.payments()[0]);
      }


      this.destroyLastOrder = this.orderService.lastOrder.subscribe( lastOrder => {
      
        this.payments().forEach( payment =>{
          
          if(payment.id===lastOrder.payment_id){
            this.selectPaymentMethod(payment);
            return;
          }
        })
        
      });
    });
  }

  ngOnDestroy(): void {
    if(this.destroyError)
      this.destroyError.unsubscribe();
    if(this.destroyLastOrder)
      this.destroyLastOrder.unsubscribe();
  }
  ngOnInit(): void {


    this.destroyError = this.orderService.paymentError.subscribe(status => {
      this.errorPayment = status;
    });




  }

  selectPaymentMethod(method: PaymentModel) {
    this.errorPayment = false;
    this.selectedAccordionId = method.id; // Actualiza el acordeón seleccionado
    this.paymentSelected.emit(method); // Emite el evento
  }
}
