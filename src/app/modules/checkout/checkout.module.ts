import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CheckoutRoutingModule } from './checkout-routing.module';
import { CheckoutLayoutComponent } from './checkout-layout/checkout-layout.component';
import { SharedModule } from '@modules/shared/shared.module';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { ShippingMethodComponent } from './components/shipping-method/shipping-method.component';
import { AddressComponent } from './components/address/address.component';
import { PaymentComponent } from './components/payment/payment.component';
import { PurchaseDetailComponent } from './components/purchase-detail/purchase-detail.component';

import { FormsModule } from '@angular/forms';
import { UserAdminModule } from '@modules/user-admin/user-admin.module';
import { NostockComponent } from './components/nostock/nostock.component';
import { ConfirmComponent } from './components/confirm/confirm.component';
import { OrderErrorComponent } from './components/order-error/order-error.component';
import { OrderIteratePurchaseComponent } from './components/order-iterate-purchase/order-iterate-purchase.component';

@NgModule({
  declarations: [
    CheckoutLayoutComponent,
    CheckoutComponent,
    ShippingMethodComponent,
    AddressComponent,
    PaymentComponent,
    PurchaseDetailComponent,
    NostockComponent,
    ConfirmComponent,
    OrderErrorComponent,
    OrderIteratePurchaseComponent,
  ],
  imports: [
    CommonModule,
    CheckoutRoutingModule,
    SharedModule,
    FormsModule,
    UserAdminModule
    
  ]
})
export class CheckoutModule { }
