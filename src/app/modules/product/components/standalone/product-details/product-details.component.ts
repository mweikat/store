import { Component, effect, inject, input } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { ProductsService } from '@services/products.service';

@Component({
  selector: 'app-product-details',
  imports: [SharedModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
})
export class ProductDetailsComponent {

  productId = input.required<string>();

  private productServices = inject(ProductsService);
  productDetails = this.productServices.$productDetail;

  constructor(){

    effect(()=>{

      if(this.productId() != undefined){
        //console.log("product id details ", this.productId());
        this.productServices.getProductDetails(this.productId());
      }
    });
  }
}
