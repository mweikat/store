import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShipmentComponent } from './shipment/shipment.component';
import { DinamicPageComponent } from './dinamic-page/dinamic-page.component';

const routes: Routes = [

  {path:'horarios',component:ShipmentComponent},
  {path:':namePage',component:DinamicPageComponent}
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
 