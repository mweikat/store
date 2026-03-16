import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@modules/shared/shared.module';
import { SiteService } from '@services/site.service';

@Component({
    selector: 'app-top-2',
    standalone:true,
    imports: [SharedModule],
    templateUrl: './top-2.component.html',
    styleUrl: './top-2.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Top2Component{

  private siteService = inject(SiteService);
  topBanner = this.siteService.top_2Signal;

  constructor(){this.siteService.getBanner('TOP_2');}
 
}
