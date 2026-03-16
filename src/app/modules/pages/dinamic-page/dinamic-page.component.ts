import { Component, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SiteService } from '@services/site.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dinamic-page',
  standalone: false,
  templateUrl: './dinamic-page.component.html',
  styleUrl: './dinamic-page.component.scss'
})
export class DinamicPageComponent implements OnDestroy{

  private siteService = inject(SiteService);
  pageInfo = this.siteService.pageInfoSignal;

  destroyRoute?:Subscription;

  constructor(private route: ActivatedRoute){
    this.destroyRoute = this.route.paramMap.subscribe(params => {
      const param = params.get('namePage');
      if(param){
        this.siteService.getPageInfo(param);
      }
    });
  }

  ngOnDestroy(): void {
    if(this.destroyRoute)
      this.destroyRoute.unsubscribe();
  }
}
