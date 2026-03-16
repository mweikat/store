import { Component, effect, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CartModel } from '@models/cart.model';
import { CartItemModel } from '@models/cartItem.model';
import { ProductNStockError } from '@models/error/productNStockError.model';
import { StockDetailsError } from '@models/error/stockDetailsError.model';
import { CartService } from '@services/cart.service';
import { OrderService } from '@services/order.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-nostock',
    templateUrl: './nostock.component.html',
    styleUrl: './nostock.component.scss',
    standalone: false
})
export class NostockComponent implements OnInit, OnDestroy{

  @Input('cart') cart:CartModel = {} as CartModel;

  stockDetail:StockDetailsError= {} as StockDetailsError;
  stockErrorView:boolean = false;
  stockErrorModel:ProductNStockError = {} as ProductNStockError;
  destroyStockError?:Subscription;
  destroyCart?:Subscription;

  private cartService = inject(CartService);
  $errorStockBundle = this.cartService.$itemDeleteBundleSignal;

  constructor(private orderService:OrderService){
    effect(()=>{
      if(this.$errorStockBundle()!=''){
          const prod = this.stockErrorModel?.stockDetails.find(item => item.cartItem?.id == this.$errorStockBundle());
          
          //console.log('id item eliminado ', prod)
          //if(prod==undefined){
          
            this.stockErrorView = false;
            this.stockErrorModel = {} as ProductNStockError;
          //}
      }
    });
  }

  ngOnInit(): void {

    this.destroyCart = this.cartService.itemDelete.subscribe(item => {
      
      
        this.removeInArray(item);
 
        //console.log("entra al if: ",this.stockErrorModel.stockDetails.length);

        const cant = this.stockErrorModel.stockDetails.find(item => item.status === "STOCKNOK");
        

        if(cant==undefined){
          
          this.stockErrorView = false;
          this.stockErrorModel = {} as ProductNStockError;
        }
      

    });


    this.destroyStockError = this.orderService.noStockError.subscribe(error => {

      //console.log('entra aca: ', error);
      //console.log('product_bundle: ', error.errorCode);

      this.stockErrorView = true;
      this.stockErrorModel = error;
      
      //if(error.errorCode=='product')
        this.listItemsWithOutStock();
      /*if(error.errorCode=='product_bundle'){

        this.stockErrorModel = {} as ProductNStockError;
        console.log('product_bundle');
      }*/
      this.scrollToTop();
    });
    
  }

  ngOnDestroy(): void {
    if(this.destroyStockError)
      this.destroyStockError.unsubscribe();
    if(this.destroyCart)  
      this.destroyCart.unsubscribe();
  }

  removeItem(item:StockDetailsError){
    
    if(item.cartItem){

      this.cartService.deleteItem(item.cartItem.id);
    }
    
  }

  removeItemBundle(item:StockDetailsError){
    if(item.cartItem?.product_bundle){
      this.cartService.deleteItemBundle(item.cartItem.id);
    }
  }

  setStock(item:StockDetailsError){ 
    let stockSet = 0;

    if(item.cartItem){
      stockSet = item.cartItem?.quantity - item.stock;
      this.cartService.remQuantity(item.cartItem.id, stockSet, true);
    }

  }

  private removeInArray(idtoRemove:string){
    
    const index = this.stockErrorModel.stockDetails.findIndex(item => item.id === idtoRemove);

    if (index !== -1) {
      this.stockErrorModel.stockDetails.splice(index, 1);
    }

    //console.log("array que queda: ", this.stockErrorModel.stockDetails);

  }

  private listItemsWithOutStock(){

    this.stockErrorModel.stockDetails.forEach(errorItem => {
      if(errorItem.status=="STOCKNOK"){
        this.cart.items.forEach(cartItem => {
          if(cartItem.product_id === errorItem.product_id){
            errorItem.cartItem = cartItem;
          }
        });
      }
    })

  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

}
