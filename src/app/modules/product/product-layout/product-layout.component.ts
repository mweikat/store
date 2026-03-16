import { Component } from '@angular/core';
import { HeaderService } from '@services/header.service';

@Component({
    selector: 'app-product-layout',
    templateUrl: './product-layout.component.html',
    styleUrl: './product-layout.component.scss',
    standalone: false
})
export class ProductLayoutComponent {

      constructor(private headerService:HeaderService){
        this.headerService.isMenu.next(true);
        this.headerService.isSearch.next(true);
        this.headerService.isCart.next(true);
        this.headerService.isUser.next(true);
        this.headerService.isToggleButton.next(true);


      }
      
}
