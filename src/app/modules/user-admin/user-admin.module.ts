import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserAdminRoutingModule } from './user-admin-routing.module';
import { UserAdminLayoutComponent } from './user-admin-layout/user-admin-layout.component';
import { OrdersComponent } from './components/orders/orders.component';
import { AddressListComponent } from './components/address-list/address-list.component';
import { SharedModule } from '@modules/shared/shared.module';
import { UserAccountComponent } from './components/user-account/user-account.component';
import { AddressAddEdtComponent } from './components/address-add-edt/address-add-edt.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserChangePassComponent } from './components/user-change-pass/user-change-pass.component';
import { OrderDetailsComponent } from './components/order-details/order-details.component';
import { UserMenuComponent } from './user-menu/user-menu.component';


@NgModule({
  declarations: [
    UserAdminLayoutComponent,
    OrdersComponent,
    AddressListComponent,
    UserMenuComponent,
    UserAccountComponent,
    AddressAddEdtComponent,
    UserChangePassComponent,
    OrderDetailsComponent
  ],
  imports: [
    CommonModule,
    UserAdminRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule
  ],
  exports:[
    AddressAddEdtComponent
  ]
})
export class UserAdminModule { }
