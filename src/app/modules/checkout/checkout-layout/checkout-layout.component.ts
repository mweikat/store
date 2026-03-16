import { Component } from '@angular/core';
import { HeaderService } from '@services/header.service';

@Component({
    selector: 'app-checkout-layout',
    templateUrl: './checkout-layout.component.html',
    styleUrl: './checkout-layout.component.scss',
    standalone: false
})
export class CheckoutLayoutComponent {

      constructor(private headerService:HeaderService){
        this.headerService.isMenu.next(false);
        this.headerService.isSearch.next(false);
        this.headerService.isCart.next(false);
        this.headerService.isUser.next(false);
        this.headerService.isToggleButton.next(false);

      }
      
}
