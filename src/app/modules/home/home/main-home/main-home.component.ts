import { ChangeDetectionStrategy, Component, effect, inject, Type } from '@angular/core';
import { HeaderService } from '@services/header.service';
import { SiteService } from '@services/site.service';
import { SlideComponent } from '../homeComponents/slide/slide.component';
import { PhotoCategoriesComponent } from '../homeComponents/photo-categories/photo-categories.component';
import { SaleComponent } from '../homeComponents/sale/sale.component';
import { DeliveryComponent } from '../homeComponents/delivery/delivery.component';
import { BrandsComponent } from '../homeComponents/brands/brands.component';
import { Sale2Component } from '../homeComponents/sale2/sale2.component';
import { HomeSectionCode, SiteHomeSectionsModel } from '@models/siteHomeSections.model';

  
@Component({
    selector: 'app-main-home',
    templateUrl: './main-home.component.html',
    styleUrl: './main-home.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainHomeComponent{

  private siteService = inject(SiteService);
  
  rrssModel = this.siteService.homeRrssSignal;
  sections = this.siteService.homeSectionSignals;

  //slideActive=false;

  componentMap: Record<HomeSectionCode, Type<any>> = {
    slide: SlideComponent,
    'photo-categories': PhotoCategoriesComponent,
    sale: SaleComponent,
    delivery: DeliveryComponent,
    brands: BrandsComponent,
    sale2: Sale2Component
  };

  
  constructor(private headerService:HeaderService){
      this.headerService.isMenu.next(true);
      this.headerService.isSearch.next(true);
      this.headerService.isCart.next(true);
      this.headerService.isUser.next(true);
      this.headerService.isToggleButton.next(true);
      this.siteService.getHomeSections();
  }

  getComponentsInput(siteHomeSections:SiteHomeSectionsModel): Record<string, unknown> {

    return {
      title: siteHomeSections.title,
      desc: siteHomeSections.desc
    };

  }
 
}
