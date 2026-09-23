import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, HostListener, inject, Inject, Input, OnChanges, PLATFORM_ID, signal, SimpleChanges } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { CategoriesService } from '@services/categories.service';

@Component({
    selector: 'app-photo-categories',
    templateUrl: './photo-categories.component.html',
    styleUrl: './photo-categories.component.scss',
    imports:[CommonModule,SharedModule],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoCategoriesComponent implements OnChanges{

  @Input() title?: string;
  @Input() desc?: string;
  @Input() ttl: string = '';

  private categoryService = inject(CategoriesService);
  categories = this.categoryService.homeCatSignal;

  chunkSizeSignal = signal<number>(6);
  showButtons: boolean = false;

  categoriesChunks = computed(() => {
    let categoriesChunksComputed = [];
    const size = this.chunkSizeSignal();
    const cats = this.categories();
    for (let i = 0; i < cats.length; i += size) {
      categoriesChunksComputed.push(cats.slice(i, i + size));
    }
    return categoriesChunksComputed;
  });

  constructor(@Inject(PLATFORM_ID) private platformId: Object){
    effect(() => {
      if(isPlatformBrowser(this.platformId)){
        this.updateChunkSize();
      }
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['ttl'].currentValue !== undefined && changes['ttl'].currentValue !== ''){
      this.categoryService.getHomeCat(this.ttl);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if(isPlatformBrowser(this.platformId)){
      this.updateChunkSize();
      //this.chunkCategories();
    }
  }

  private updateChunkSize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const width = window.innerWidth;
    let newSize = 6;

    if (width >= 1200) {
      newSize = 6; // Pantallas grandes
      this.showButtons = false;
    } else if (width >= 768) {
      newSize = 4; // Tablets
      this.showButtons = true;
    } else {
      newSize = 3; // Dispositivos móviles
      this.showButtons = true;
    }

    if (this.chunkSizeSignal() !== newSize) {
      this.chunkSizeSignal.set(newSize);
    }
  }

  /*private chunkCategories(): void {
    this.categoriesChunks = [];
    for (let i = 0; i < this.categories().length; i += this.chunkSize) {
      this.categoriesChunks.push(this.categories().slice(i, i + this.chunkSize));
    }
  }*/

}
