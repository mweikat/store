import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@modules/shared/shared.module';
import { SiteService } from '@services/site.service';

@Component({
    selector: 'app-top',
    templateUrl: './top.component.html',
    styleUrl: './top.component.scss',
    standalone:true,
    imports:[SharedModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopComponent {

  private siteService = inject(SiteService);
  rrssModel = this.siteService.homeRrssSignal;

  topBanner = this.siteService.top_1Signal;

  constructor(){
    this.siteService.setMetaData();
    this.siteService.getHomeRrss();
    this.siteService.getBanner('TOP_1');
  }

}
              