import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { SiteService } from '@services/site.service';

@Component({
    selector: 'app-slide',
    templateUrl: './slide.component.html',
    styleUrl: './slide.component.scss',
    standalone: true,
    imports:[CommonModule,SharedModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlideComponent implements OnChanges{

  @Input() title?: string;
  @Input() desc?: string;
  @Input() ttl: string='';

  private siteService = inject(SiteService);
  slides = this.siteService.homeSlideSignal;
  hasSlides = computed(() => this.slides().length > 0);
  carouselInterval = 3000;

  constructor(){}
  
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['ttl'].currentValue !== '' && changes['ttl'].currentValue !== undefined){
      //console.log('Changes detected in SlideComponent:', this.ttl);
      this.siteService.getHomeSlide(this.ttl);
    }
  }

  isExternal(url: string): boolean {
    return url.startsWith('http') || url.startsWith('//');
  }
  
}
