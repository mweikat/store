import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CartModel } from '@models/cart.model';
import { CartItemModel } from '@models/cartItem.model';
import { MessageModel } from '@models/message.model';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MessagesService } from './messages.service';
import { CartItemQRModel } from '@models/cartItemQR.model';
import { isPlatformBrowser } from '@angular/common';
import { BusinessService } from './business.service';
import { BusinessModel } from '@models/business.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private readonly URL = environment.api_store;

  private business:BusinessModel = {} as BusinessModel;

  private $currentCart = signal<CartModel>({} as CartModel);
  public readonly $currentCartSignal = this.$currentCart.asReadonly();

  private $cantCart = signal<number>(0);
  public  $cantCartSignal = this.$cantCart.asReadonly();

  private $totalCart = signal<number>(0);
  public  $totalCartSignal = this.$totalCart.asReadonly();

  private readonly cartModelMenu$: BehaviorSubject<CartModel> = new BehaviorSubject( {} as CartModel);
  public readonly currentCartMenu: Observable<CartModel> = this.cartModelMenu$.asObservable();

  private readonly cartQuantResult$: Subject<CartItemQRModel> =new Subject();
  public readonly quantResult: Observable<CartItemQRModel> = this.cartQuantResult$.asObservable();

  private readonly itemDelete$: Subject<string> =new Subject();
  public readonly itemDelete: Observable<string> = this.itemDelete$.asObservable();

  private $itemDeleteBundle = signal<string>('');
  public readonly $itemDeleteBundleSignal = this.$itemDeleteBundle.asReadonly();

  private $totalPriceCart = signal<number>(0);
  public readonly totalPriceCartSignal = this.$totalPriceCart.asReadonly();

  constructor(private httpClient:HttpClient, private router: Router, 
              private messageService:MessagesService,
              @Inject(PLATFORM_ID) private platformId: Object,
              private businessService: BusinessService
            ) {
              if(isPlatformBrowser(this.platformId)){
                this.business = this.businessService.getBusinessStorage();
              }
             }

  getCart(){

    if(isPlatformBrowser(this.platformId)){

      let cart:CartModel = this.getCartFromLocalSession();
      let cartId: string | null = null;
  
      if(cart!=undefined){
        cartId=cart.id;
      }
      
      this.httpClient.get <CartModel>(`${this.URL}/cart${cartId ? `/${cartId}` : ''}`).subscribe(cart => {
        this.delCartFromLocalSession();
        if(cart != undefined){
           
          this.setCartFromLocalSession(cart);
          this.$currentCart.set(cart);
          this.cartModelMenu$.next(cart);
          
        }
      });
      
    }

  }

  getTotalPriceCartCart(){

    if(isPlatformBrowser(this.platformId)){

      let cart:CartModel = this.getCartFromLocalSession();
      let cartId: string | null = null;
  
      if(cart!=undefined){
        cartId=cart.id;
      }
      
      this.httpClient.get <number>(`${this.URL}/cart-total-price${cartId ? `/${cartId}` : ''}`).subscribe(cartTotal => {
        
        this.$totalPriceCart.set(cartTotal);
        
      });
      
    }

  }

  getCartLoggedIn(){

    if(isPlatformBrowser(this.platformId)){

      let cart:CartModel = this.getCartFromLocalSession();
      let cartId: string | null = null;
  
      if(cart!=undefined){
        cartId=cart.id;
      }
      
      this.httpClient.get <CartModel>(`${this.URL}/cart_user${cartId ? `/${cartId}` : ''}`).subscribe(cart => {
        
        this.delCartFromLocalSession();
        //console.log(' cart user: ', cart);
        if(cart != undefined){
          
          this.setCartFromLocalSession(cart);
          this.$currentCart.set(cart);
          this.cartModelMenu$.next(cart);
          
        }else{
          this.$currentCart.set({} as CartModel);
          this.cartModelMenu$.next({} as CartModel);
        }
      });

    }
  }

  addToCart(cartItem: CartItemModel, isLogged:boolean) {

    let cart:CartModel = this.getCartFromLocalSession();

    if(cart!=undefined){
      cartItem.cartId = cart.id;
    }

    let urlEndopoint="cart-item";
    if(isLogged)
      urlEndopoint = "cart-user-item";

    let toJson = {cartItem};

    this.httpClient.post<CartModel>(`${this.URL}/${urlEndopoint}`,toJson, { responseType: 'json'}).subscribe(receivedItem => {
      this.setCartFromLocalSession(receivedItem);

      this.$currentCart.set(receivedItem);
      this.cartModelMenu$.next(receivedItem);

      const msgModel = {} as MessageModel;
      msgModel.msg="El producto ha sido agregado al carrito.";
      msgModel.active=1;
      msgModel.duration=2;
      msgModel.title="Add to Cart";
      msgModel.icon="ok";
      msgModel.vertical = "top-0";
      this.messageService.sendMessage(msgModel);

    },(err)=>{
      if(err.status=422){
        
        const msgModel = {} as MessageModel;
        msgModel.msg="No se cuenta con más stock para agregar al carrito.";
        msgModel.active=1;
        msgModel.duration=3;
        msgModel.title="Error on Update Quantity";
        msgModel.icon="nok";
        msgModel.vertical = "top-0";
        this.messageService.sendMessage(msgModel);

        //this.$haveStock.set(false);
      }
    }); 

  }

  async addToCartAndGoCheckout(cartItem: CartItemModel, islogged:boolean){

    const myCart = this.getCartFromLocalSession();
    //console.log('cart ', myCart);
    if(myCart.items != undefined){

      //const itermFound = myCart.items.find((item: { product_id: string; }) => item.product_id == cartItem.id);
      const exists = myCart.items.some((item: { product_id: string; }) => item.product_id === cartItem.product_id);
      //console.log('item exists ', exists);
      
      if(!exists){
        //console.log('add item  to cart ', cartItem);
        await this.addToCart(cartItem,islogged);
      }

    }else{
      //console.log('No cart cart ', cartItem);
      await this.addToCart(cartItem,islogged);
    }
    

    this.goCart();

  }

  deleteItem(id:string){
    this.httpClient.delete(`${this.URL}/cart-item/${id}`).subscribe(() => {
      
      this.removeItemFromCart(id);
    });
  }

  deleteItemBundle(id:string){
    this.httpClient.delete(`${this.URL}/cart-item-bundle/${id}`).subscribe(() => {
      this.removeItemBundleFromCart(id);
    });
  }

  asosiateCart(cartId:string){
    let cartToJson = {cartId:cartId};
    this.httpClient.put(`${this.URL}/cart`,cartToJson,{ responseType: 'json'}).subscribe(item => {
      
    });
  }

  
  getCartFromLocalSession(){
    return JSON.parse(localStorage.getItem(`cart_${this.business.id}`) || '[]');
  }

  addQuantity(cartItemId:string, quantity:number, cartReload:boolean){
  
    let add = {cartItemId:cartItemId, quantity:quantity, operation:"add"};

    this.httpClient.put<CartItemQRModel>(`${this.URL}/cart-quantity-change`,add, { responseType: 'json'}).subscribe(resp => {
      
      resp.cartItemId = cartItemId;
      resp.operation="add";
      this.cartQuantResult$.next(resp);

      if(resp.action){
        this.uptateQuantityItemFromCart(cartItemId, resp.current,cartReload);
      }

    });

  }

  remQuantity(cartItemId:string, quantity:number, cartReload:boolean){
  
    let rem = {cartItemId:cartItemId, quantity:quantity, operation:"rem"};

    this.httpClient.put<CartItemQRModel>(`${this.URL}/cart-quantity-change`,rem, { responseType: 'json'}).subscribe(resp => {
   
      resp.cartItemId = cartItemId;
      resp.operation="rem";
      this.cartQuantResult$.next(resp);

      if(resp.action){
        this.uptateQuantityItemFromCart(cartItemId, resp.current, cartReload);
      }
      
    });
  }

  public calculateCartTotal(cart: CartModel) {
  
    let totalQuantity = 0;
    let totalPrice = 0;

    cart.items.forEach(item => {
      totalQuantity += item.quantity;
      totalPrice += item.quantity * item.price;
      if(item.product_bundle && item.product_bundle.id!=undefined){
        totalPrice += item.product_bundle.discount_price*item.quantity;
        totalQuantity += item.quantity;
      }
    });

    this.$cantCart.set(totalQuantity);
    this.$totalCart.set(totalPrice);

  }

  private async uptateQuantityItemFromCart(itemId: string, quantity:number, cartReload:boolean){

    let cart: CartModel = await this.getCartFromLocalSession();
    
    if (!cart || !cart.items) {
        //console.warn('Carrito no encontrado o sin elementos');
        return;
    }

    const index = cart.items.findIndex(item => item.id === itemId);

    if (index !== -1) {
      cart.items[index].quantity = quantity;
      
    } 
   
    this.setCartFromLocalSession(cart);

    this.cartModelMenu$.next(cart);
    
    if(cartReload)
      this.$currentCart.set(cart);

  }
  
  // Método para eliminar un item del CartModel
  private async removeItemFromCart(itemId: string)  {
    let cart: CartModel = await this.getCartFromLocalSession();
    
    if (!cart || !cart.items) {
        console.warn('Carrito no encontrado o sin elementos');
        return;
    }
    
    // Filtra los elementos
    //const initialCount = cart.items.length;
    cart.items = cart.items.filter(item => item.id !== itemId);
    //const newCount = cart.items.length;
    //console.log('init ' + initialCount);
    //console.log('final  ' + newCount);

    // Guardar en almacenamiento local
    this.setCartFromLocalSession(cart);
    
    // Emitir cambio
    this.$currentCart.set(cart);
    this.cartModelMenu$.next(cart);
    this.itemDelete$.next(itemId);

    if(cart.items.length==0)
      this.goCart();

    
}

private async removeItemBundleFromCart(itemId: string){

  let cart: CartModel = await this.getCartFromLocalSession();
    
  if (!cart || !cart.items) {
      console.warn('Carrito no encontrado o sin elementos');
      return;
  }

  const updatedItems = cart.items.map(item => {
    if (item.id === itemId) {
      return { ...item, product_bundle : null };
    }
    return item;
  });

  cart.items = updatedItems;

  //console.log('cart: ', cart)

  // Guardar en almacenamiento local
  this.setCartFromLocalSession(cart);
  
  // Emitir cambio
  this.$currentCart.set(cart);
  this.cartModelMenu$.next(cart);
  this.$itemDeleteBundle.set(itemId);

  if(cart.items.length==0)
    this.goCart();
}

private setCartFromLocalSession(cart:CartModel){
  localStorage.setItem(`cart_${this.business.id}`, JSON.stringify(cart));
}

private delCartFromLocalSession(){
  localStorage.removeItem(`cart_${this.business.id}`);
}

private  goCart(){
  this.router.navigate(['/cart'])
}



}
