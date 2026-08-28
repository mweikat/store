
import { Component, effect, inject, Inject, OnDestroy, OnInit, DOCUMENT } from '@angular/core';
import { CartItemModel } from '@models/cartItem.model';
import { CartItemVariantModel } from '@models/cartItemVariant.model';
import { AuthService } from '@services/auth.service';
import { CartService } from '@services/cart.service';
import { SeoService } from '@services/seo.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-cart-list',
    templateUrl: './cart-list.component.html',
    styleUrl: './cart-list.component.scss',
    standalone: false
})
export class CartListComponent implements OnInit, OnDestroy{

  private cartService = inject(CartService);
  private seoService = inject(SeoService);
  private authService = inject(AuthService);
  
  cartModel = this.cartService.$currentCartSignal;
  destroyQuantityItem?:Subscription;
  isLooged:boolean = false;
  isReady:boolean = false;
  totalPrice = this.cartService.$totalCartSignal;

  //cartItems: CartItemModel[] = [];
  
  constructor(@Inject(DOCUMENT) private document: Document){
    
    this.seoService.setIndexFallow(false);

    effect(()=>{

        if(this.cartModel().id!=undefined){
           if(this.cartModel().items.length>0)
            this.isReady = true;
           else
            this.isReady = false;
        }

    });

  }
  
  ngOnDestroy(): void {
    if(this.destroyQuantityItem)
      this.destroyQuantityItem.unsubscribe();
  }

  ngOnInit(): void {
    
    this.loadComponents();
    

  }

  async loadComponents (){

    this.isLooged = await this.authService.isLoggedIn();

    this.destroyQuantityItem = await this.cartService.quantResult.subscribe(resp =>{
      
      if(resp.action==true){

        if(resp.cartItemVariantId===undefined){

          const item = this.cartModel().items.find(item => item.id === resp.cartItemId);
      
          if(item)
            item.quantity = resp.current;

        }else{
          const item = this.cartModel().items.find(item => item.id === resp.cartItemId);
          if(item && item.cartVariant){
            const itemVariant = item.cartVariant.find(item => item.id === resp.cartItemVariantId);
            if(itemVariant)
              itemVariant.quantity = resp.current;
          }
        }



        
      }  
      
      if(resp.cartItemVariantId===undefined){
        if(resp.cartItemId && resp.operation=="add")
          this.setEnOrDisAdd(resp.cartItemId,"false");
        if(resp.cartItemId && resp.operation=="rem")
          this.setEnOrDisAddRem(resp.cartItemId,"false");
      }else{
        if(resp.cartItemVariantId && resp.operation=="add")
          this.setEnOrDisAdd(resp.cartItemVariantId,"false");
        if(resp.cartItemVariantId && resp.operation=="rem")
          this.setEnOrDisAddRem(resp.cartItemVariantId,"false");
      }
    });


  }

  increaseQuantity(item: CartItemModel) {
    this.cartService.addQuantity(item.id,1, false);
    this.setEnOrDisAdd(item.id,"true");
  }

  decreaseQuantity(item: CartItemModel) {
    this.cartService.remQuantity(item.id,1, false);
    this.setEnOrDisAddRem(item.id,"true");
  }

  removeItem(item: CartItemModel) {
    
    this.cartService.deleteItem(item.id);

  }

  extraerValor(texto: string): string {
    return this.cartService.extraerDatoVariant(texto);
  }

  increaseQuantityVariant(cartVariant: CartItemVariantModel) {
    //console.log("increaseQuantityVariant",cartVariant);
    if(cartVariant.stock>=cartVariant.quantity+1){
      this.cartService.addQuantityVariant(cartVariant.cart_item_id, cartVariant.id,1, false);
      this.setEnOrDisAdd(cartVariant.id,"true");
    }
  }

  decreaseQuantityVariant(cartVariant: CartItemVariantModel) {
    //console.log("decreaseQuantityVariant",cartVariant);
    if(cartVariant.quantity>1){
      this.cartService.remQuantityVariant(cartVariant.cart_item_id, cartVariant.id,1, false);
      this.setEnOrDisAddRem(cartVariant.id,"true");
    }
  }

  removeItemVariant(cartVariant: CartItemVariantModel) {
    this.cartService.deleteItemVariant(cartVariant.cart_item_id, cartVariant.id);
  }

  private setEnOrDisAdd(id:string,status:string){
    if(status=="true")
      this.document.getElementById('btn_'+id)?.setAttribute("disabled",status);
    else
      this.document.getElementById('btn_'+id)?.removeAttribute('disabled');
  }
  private setEnOrDisAddRem(id:string,status:string){
    if(status=="true")
      this.document.getElementById('btd_'+id)?.setAttribute("disabled",status);
    else
      this.document.getElementById('btd_'+id)?.removeAttribute('disabled');
  }
  
}
