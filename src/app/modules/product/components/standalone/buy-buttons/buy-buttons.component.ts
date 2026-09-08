import { Component, computed, inject, input, signal } from '@angular/core';
import { CartItemModel } from '@models/cartItem.model';
import { ProductModel } from '@models/product.model';
import { ProductVariantSkuModel } from '@models/productVariantSku.model';
import { AuthService } from '@services/auth.service';
import { CartService } from '@services/cart.service';
import { ProductAttrService } from '@services/product-attr.service';

@Component({
  selector: 'app-buy-buttons',
  imports: [],
  templateUrl: './buy-buttons.component.html',
  styleUrl: './buy-buttons.component.scss',
})
export class BuyButtonsComponent {

  private authService = inject(AuthService);
  private cartService = inject(CartService);
  
  product = input.required<ProductModel>();
  bundle = input.required<any>();
  variantStock = input.required<number>();
  isConsulting = input.required<boolean>();
  variantCartItem = input<ProductVariantSkuModel | undefined>(undefined);
  isLogged = computed(()=> this.authService.isLoggedIn());
  isAddingToCart= signal<boolean>(false);
  cantProduct:number = 1;

  constructor() {}

  // Lógica para agregar al carrito
  async addToCart(product: ProductModel) {
  
      if (this.isAddingToCart()) return;
      
      this.isAddingToCart.set(true);
      
  
      if (this.cantProduct > product.stock) {
        alert(`No se puede agregar más de ${product.stock} unidades de este producto.`);
        this.restCant();
        return;
      }
  
      //add cant variant
      const variantCartItem = this.variantCartItem();
      if(variantCartItem!=undefined)
        variantCartItem.quantity = this.cantProduct;
      
  
      const item: CartItemModel = {
        id: '',
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: this.cantProduct,
        price: product.price,
        product_bundle: this.bundle(),
        variant: variantCartItem || undefined
      };
  
      await this.cartService.addToCart(item, this.isLogged());
      this.isAddingToCart.set(false);

    
  }

  // Lógica para comprar directamente
  buyNow(product: ProductModel) {
    
        //add cant variant
        const variantCartItem = this.variantCartItem();
        if(variantCartItem!=undefined)
        variantCartItem.quantity = this.cantProduct;
    
        const item:CartItemModel = {
          id:'',
          product_id:product.id,
          product_name: product.name,
          sku: product.sku,
          quantity: this.cantProduct,
          price:product.price,
          product_bundle: this.bundle(),
          variant: this.variantCartItem() || undefined
        }
    
        this.cartService.addToCartAndGoCheckout(item,this.isLogged());
        
  }

  restCant(){
    if(this.cantProduct>1)
      this.cantProduct--;
  }
  
  addCant(){
    if(this.cantProduct < this.product().stock)
      this.cantProduct++;
  }
}
