import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CartListComponent } from './components/cart-list/cart-list.component';
import { FastRegisterComponent } from './components/fast-register/fast-register.component';

const routes: Routes = [
  {path:'', component:CartListComponent},
  {path:'info', component:FastRegisterComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CartRoutingModule { }
