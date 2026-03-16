import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-checkout-steps',
  standalone: false,
  templateUrl: './checkout-steps.component.html',
  styleUrl: './checkout-steps.component.scss'
})
export class CheckoutStepsComponent {

  @Input() currentStep: number = 0;

  steps = [
    //{ label: 'Carrito', route: '/checkout/cart' },
    { label: 'Datos', route: '/checkout/info',icon:'file-earmark-text' },
    { label: 'Entrega', route: '/checkout/profile',icon:'truck' },
    { label: 'Pago', route: '/checkout/payment', icon:'credit-card' },
    { label: 'Confirma', route: '/checkout/confirmation', icon:'check-circle' },
  ];

  constructor(){}

  

  get progressPercentage(): number {
    if(this.currentStep==0)
      return 25;
    if(this.currentStep==1)
      return 50;
    else
      return 75;
    //return ((this.currentStep) / this.steps.length) * 100;
  }
  
}
