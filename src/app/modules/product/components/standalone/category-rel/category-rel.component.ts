import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnChanges, signal, SimpleChanges } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { CategoriesService } from '@services/categories.service';

@Component({
  selector: 'app-category-rel',
  templateUrl: './category-rel.component.html',
  styleUrl: './category-rel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:[CommonModule,SharedModule]

})
export class CategoryRelComponent implements OnChanges{
  // Input convertido a signal
  categoriesNames = input.required<string[]>();
  productIdToHide = input.required<string>();
  //services
  private categoryService = inject(CategoriesService);
  
  // Señales reactivas
  changecat = this.categoryService.categoryModelPtodRelSignal;
  productsRel = computed(() => {

    return [
      ...new Map(
        this.changecat()
          .flatMap(category => category.products || [])
          .map(product => [product.id, product]) // usar una key única, como 'id'
      ).values()
    ];

    // Filtrar para excluir el producto actual
    //return allProducts.filter(product => product.id !== currentId);
  });

  visibleProducts = computed(() => {
    //const products = this.productsRel();
    const products = this.productsRel().filter(product => product.id !== this.productIdToHide());
    return products?.slice(this.currentIndex(), this.currentIndex() + this.itemsPerPage) || [];
  });

  showPrevArrow = computed(() => this.currentIndex() > 0);
  
  showNextArrow = computed(() => {
    const products = this.productsRel() || [];
    return this.currentIndex() + this.itemsPerPage < products.length;
  });

  //vars
  currentIndex = signal(0);
  itemsPerPage = 4; // Puedes convertirlo en signal si es dinámico
  private counter:number = 1;

  // Constructor con efectos reactivos
  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {

    //console.log('bbbb ', this.categoriesNames().length, this.counter);
      
    if(this.categoriesNames().length>0 && this.counter==1){
       
       this.categoryService.getCategoryByNameProdRel(this.categoriesNames());
       this.counter++;
    }
    
  }

  // Métodos modificados para usar signals
  next(): void {
    const products = this.productsRel() || [];
    if (this.currentIndex() + this.itemsPerPage < products.length) {
      this.currentIndex.update(idx => idx + 1);
    }
  }

  prev(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(idx => idx - 1);
    }
  }
}