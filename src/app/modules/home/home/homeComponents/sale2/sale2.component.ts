import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Input } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { CategoriesService } from '@services/categories.service';

@Component({
    selector: 'app-sale2',
    templateUrl: './sale2.component.html',
    styleUrl: './sale2.component.scss',
    standalone: true,
    imports:[CommonModule, SharedModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sale2Component {

  @Input() title?: string;
  @Input() desc?: string;

  private categoryService = inject(CategoriesService);
  category = this.categoryService.categoryModelHome2Signal;
  products = computed(() => this.category()[0].products);

  constructor(){
    this.categoryService.getCategoryByPosition('HOME_2');
  }
  
  

}
