import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Input } from '@angular/core';
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
export class SlideComponent{

  @Input() title?: string;
  @Input() desc?: string;

  private siteService = inject(SiteService);
  slides = this.siteService.homeSlideSignal;
  hasSlides = computed(() => this.slides().length > 0);
  carouselInterval = 3000;

  constructor(){this.siteService.getHomeSlide();}

  isExternal(url: string): boolean {
    return url.startsWith('http') || url.startsWith('//');
  }
  
}
