import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { ConfirmComponent } from './components/confirm/confirm.component';
import { OrderErrorComponent } from './components/order-error/order-error.component';

const routes: Routes = [
  {path:'', component:CheckoutComponent},
  {path:'confirm/:orderNum', component:ConfirmComponent},
  {path:'error', component:OrderErrorComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CheckoutRoutingModule { }
