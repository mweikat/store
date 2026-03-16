import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SharedModule } from '@modules/shared/shared.module';
import { CategoriesService } from '@services/categories.service';

@Component({
    selector: 'app-sale',
    templateUrl: './sale.component.html',
    styleUrl: './sale.component.scss',
    imports:[CommonModule, RouterLink, SharedModule],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaleComponent{

  @Input() title?: string;
  @Input() desc?: string;

  private categoryService = inject(CategoriesService);
  category = this.categoryService.categoryModelHome1Signal;
  products = computed(() => this.category()[0].products);

  constructor(){

    this.categoryService.getCategoryByPosition('HOME_1');

  }

}