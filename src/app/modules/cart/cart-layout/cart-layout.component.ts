import { Component } from '@angular/core';
import { HeaderService } from '@services/header.service';

@Component({
    selector: 'app-cart-layout',
    templateUrl: './cart-layout.component.html',
    styleUrl: './cart-layout.component.scss',
    standalone: false
})
export class CartLayoutComponent {
   
  constructor(private headerService:HeaderService){
    this.headerService.isMenu.next(false);
    this.headerService.isSearch.next(false);
    this.headerService.isToggleButton.next(false);

  }

}
