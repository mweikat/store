import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductModel } from '@models/product.model';
import { ImgBrokenDirective } from '@directives/img-broken.directive';
import { ComaToDotPipe } from '@pipes/coma-to-dot.pipe';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, ImgBrokenDirective, ComaToDotPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductModel;

  get mainImage(): string {
    if (this.product?.imgs && this.product.imgs.length > 0 && this.product.imgs[0].img) {
      return this.product.imgs[0].img;
    }
    if (this.product?.imgP) {
      return this.product.imgP;
    }
    return 'assets/images/imgnodisp.webp';
  }

  get discountPercent(): number | null {
    if (this.product?.price && this.product?.priceSale && this.product.price > this.product.priceSale) {
      const discount = ((this.product.price - this.product.priceSale) / this.product.price) * 100;
      return Math.round(discount);
    }
    return null;
  }
}
