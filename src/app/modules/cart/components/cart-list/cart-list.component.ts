import { DOCUMENT } from '@angular/common';
import { Component, effect, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { CartItemModel } from '@models/cartItem.model';
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

        const item = this.cartModel().items.find(item => item.id === resp.cartItemId);
      
        if(item)
          item.quantity = resp.current;
      }  
      
        if(resp.cartItemId && resp.operation=="add")
          this.setEnOrDisAdd(resp.cartItemId,"false");
        if(resp.cartItemId && resp.operation=="rem")
          this.setEnOrDisAddRem(resp.cartItemId,"false");
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
