import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrdersComponent } from './components/orders/orders.component';
import { AddressListComponent } from './components/address-list/address-list.component';
import { UserAccountComponent } from './components/user-account/user-account.component';
import { UserChangePassComponent } from './components/user-change-pass/user-change-pass.component';

const routes: Routes = [
  {path:'orders',component:OrdersComponent},
  {path:'address',component:AddressListComponent},
  {path:'profile',component:UserAccountComponent},
  {path:'change-pass',component:UserChangePassComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserAdminRoutingModule { }
