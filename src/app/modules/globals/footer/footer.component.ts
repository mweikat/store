import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SiteService } from '@services/site.service';
import { TenantService } from 'src/app/core/tenants/tenants.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss',
    standalone:true,
    imports: [CommonModule, RouterModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent{

  private siteService = inject(SiteService);
  private tenantService = inject(TenantService);

  rrssModel = this.siteService.homeRrssSignal;
  logoFooter = this.siteService.homeLogosSignal().logo_footer;
  business = this.tenantService.getCurrentBusiness();

  constructor(){
    this.siteService.getHomeRrss();
  }
  

  
}
