import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { HeaderService } from '@services/header.service';
import { SeoService } from '@services/seo.service';

@Component({
    selector: 'app-user-admin-layout',
    templateUrl: './user-admin-layout.component.html',
    styleUrl: './user-admin-layout.component.scss',
    standalone: false
})
export class UserAdminLayoutComponent implements OnInit{

  menuVisible = true;
  isMobile = false;

  constructor(private headerService:HeaderService, @Inject(PLATFORM_ID) private platformId: Object, private seoService:SeoService){
    this.headerService.isMenu.next(true);
    this.headerService.isSearch.next(true);
    this.headerService.isCart.next(true);
    this.headerService.isUser.next(true);
    this.headerService.isToggleButton.next(true);

    this.seoService.setIndexFallow(false);
  }

  ngOnInit(): void {
    
    if(isPlatformBrowser(this.platformId)){
  
      this.checkIfMobile();
      window.addEventListener('resize', () => this.checkIfMobile());
    }
  }

  toggleMenu(): void {
    this.menuVisible = !this.menuVisible;
  }

  checkIfMobile(): void {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) {
      this.menuVisible = false; // Oculta el menú en móviles por defecto
    }
  }
}
