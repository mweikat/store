import { Component } from '@angular/core';
import { HeaderService } from '@services/header.service';

@Component({
    selector: 'app-cat-layout',
    templateUrl: './cat-layout.component.html',
    styleUrl: './cat-layout.component.scss',
    standalone: false
})
export class CatLayoutComponent {

      constructor(private headerService:HeaderService){
        this.headerService.isMenu.next(true);
        this.headerService.isSearch.next(true);
        this.headerService.isCart.next(true);
        this.headerService.isUser.next(true);
        this.headerService.isToggleButton.next(true);
      }
}
