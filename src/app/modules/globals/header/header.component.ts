import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { CategoriesService } from '@services/categories.service';
import { HeaderService } from '@services/header.service';
import { SiteService } from '@services/site.service';

@Component({
    selector: 'app-header',
    standalone:true,
    imports: [SharedModule, CommonModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit{

  private categoryService = inject(CategoriesService);
  private siteService = inject(SiteService);
  //private sanitizer = inject(DomSanitizer);
  
  categories = this.categoryService.menu1CategoriesSignal;
  
  
  isSidebarOpen = false;

  //logo!: SafeUrl;
  //logo_phone!: SafeUrl;

  logos = this.siteService.homeLogosSignal;
  
  constructor( public  headerService:HeaderService){

    this.categoryService.getMenu('menu_header');
    this.siteService.getLogos();
    this.siteService.setSiteGoogleTagManager();

    this.headerService.isMenu.next(true);
    this.headerService.isSearch.next(true);
    this.headerService.isUser.next(true);
    this.headerService.isCart.next(true);
    this.headerService.isToggleButton.next(true);

  }

  ngOnInit() {
    this.buildMenu(this.categories());
    //console.log('analizando businessModel ', this.businessModel);
    //this.logo = this.sanitizer.bypassSecurityTrustUrl(this.siteService.homeLogosSignal().logo);
    //this.logo_phone = this.sanitizer.bypassSecurityTrustUrl(this.siteService.homeLogosSignal().logo_phone);
  }

  

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  buildMenu(categories: any[]): any[] {
    const mainCategories = categories.filter(cat => !cat.parent);
    mainCategories.forEach(mainCat => {
      mainCat.subCategories = categories.filter(subCat => subCat.parent === mainCat.id);
    });
    return mainCategories;
  }

}