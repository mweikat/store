import { Component } from '@angular/core';
import { HeaderService } from '@services/header.service';
import { SeoService } from '@services/seo.service';
import { SpinnerService } from '@services/spinner.service';

@Component({
    selector: 'app-layoutauth',
    templateUrl: './layoutauth.component.html',
    styleUrl: './layoutauth.component.scss',
    standalone: false
})
export class LayoutauthComponent {
  
  
        constructor(private headerService:HeaderService, private seoService:SeoService){
          this.headerService.isMenu.next(true);
          this.headerService.isSearch.next(true);
          this.headerService.isCart.next(true);
          this.headerService.isUser.next(true);
          this.headerService.isToggleButton.next(true);

          this.seoService.setIndexFallow(false);
        }
        
}
