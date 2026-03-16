import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, HostListener, inject, Inject, Input, PLATFORM_ID } from '@angular/core';
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
export class PhotoCategoriesComponent{

  @Input() title?: string;
  @Input() desc?: string;

  private categoryService = inject(CategoriesService);
  categories = this.categoryService.homeCatSignal;

  categoriesChunks= computed(()=>{
    let categoriesChunksComputed = [];
    for (let i = 0; i < this.categories().length; i += this.chunkSize) {
      categoriesChunksComputed.push(this.categories().slice(i, i + this.chunkSize));
    }
    return categoriesChunksComputed;
  })
  chunkSize: number = 6;
  showButtons:boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object){
    this.categoryService.getHomeCat();

    effect(()=>{

      if(isPlatformBrowser(this.platformId)){
        this.updateChunkSize();
        //this.chunkCategories();
      }

    });
  }

  @HostListener('window:resize')
  onResize(): void {
    if(isPlatformBrowser(this.platformId)){
      this.updateChunkSize();
      //this.chunkCategories();
    }
  }

  private updateChunkSize(): void {
    const width = window.innerWidth;

    if (width >= 1200) {
      this.chunkSize = 6; // Pantallas grandes
      this.showButtons =  false;
    } else if (width >= 768) {
      this.chunkSize = 4; // Tablets
      this.showButtons =  true;
    } else {
      this.chunkSize = 3; // Dispositivos móviles
      this.showButtons =  true;
    }
  }

  /*private chunkCategories(): void {
    this.categoriesChunks = [];
    for (let i = 0; i < this.categories().length; i += this.chunkSize) {
      this.categoriesChunks.push(this.categories().slice(i, i + this.chunkSize));
    }
  }*/

}
