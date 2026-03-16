import { ChangeDetectorRef, Component, inject, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CartModel } from '@models/cart.model';
import { AuthService } from '@services/auth.service';
import { CartService } from '@services/cart.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-cart-menu',
    templateUrl: './cart-menu.component.html',
    styleUrl: './cart-menu.component.scss',
    standalone: false
})
export class CartMenuComponent implements OnInit, OnDestroy{

  private cartService = inject(CartService);
  cant = this.cartService.$cantCartSignal;
  totalPrice = this.cartService.$totalCartSignal;
  cart:CartModel = {} as CartModel;
  destroyCart?:Subscription;
  //cant:number = 0;
  //totalPrice = 0;

  constructor(private authService:AuthService, private cdRef: ChangeDetectorRef){ 
    
      if(this.authService.isLoggedIn())
        this.cartService.getCartLoggedIn()
      else
        this.cartService.getCart();
    
  }

  ngOnDestroy(): void {
    if(this.destroyCart)
      this.destroyCart.unsubscribe();
  }

  ngOnInit(): void {

      this.destroyCart = this.cartService.currentCartMenu.subscribe(cart => {
        
        if(cart.id!=undefined){
        
          this.cart =  cart;
          this.cartService.calculateCartTotal(cart);
          //this.calculateCartTotal(cart);
        }
          
      });
    
  }

  delete(id:string){
    this.cartService.deleteItem(id);
  }

  // Función para contar la cantidad total de productos y obtener el total del carrito
  /*private calculateCartTotal(cart: CartModel) {
  
    let totalQuantity = 0;
    let totalPrice = 0;

    cart.items.forEach(item => {
      totalQuantity += item.quantity;
      totalPrice += item.quantity * item.price;
    });

    this.cant = totalQuantity;
    this.totalPrice = totalPrice;

    this.cdRef.detectChanges();
  }*/

}
