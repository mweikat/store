import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { PaymentModel } from '@models/payment.model';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private URL = environment.api_business;

  private $paymentsMethods = signal<PaymentModel[]>([]);
  public readonly paymentsMethodsSignal = this.$paymentsMethods.asReadonly();

  constructor(private httpClient:HttpClient) { }

  getPayments(){
    this.httpClient.get <PaymentModel[]>(`${this.URL}/payments`).subscribe(items => {
      this.$paymentsMethods.set(items);
    });

  }


}
