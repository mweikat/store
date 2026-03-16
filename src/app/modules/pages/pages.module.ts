import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { RouterLink } from '@angular/router';
import { ShipmentComponent } from './shipment/shipment.component';
import { LogoutComponent } from './logout/logout.component';
import { PagesRoutingModule } from './pages-routing.module';
import { LayoutpagesComponent } from './layoutpages/layoutpages.component';
import { DinamicPageComponent } from './dinamic-page/dinamic-page.component';



@NgModule({
  declarations: [
    ShipmentComponent,
    LogoutComponent,
    LayoutpagesComponent,
    DinamicPageComponent
  ],
  imports: [
    CommonModule,
    RouterLink,
    SharedModule,
    PagesRoutingModule
  ]
})
export class PagesModule { }
