import { ChangeDetectionStrategy, Component, computed, effect, inject, Inject, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CartItemModel } from '@models/cartItem.model';
import { DeliveryModel } from '@models/delivery.model';
import { ProductModel } from '@models/product.model';
import { ProductBundle } from '@models/productBundle.model';
import { AuthService } from '@services/auth.service';
import { CartService } from '@services/cart.service';
import { CategoriesService } from '@services/categories.service';
import { DeliveryService } from '@services/delivery.service';
import { ProductsService } from '@services/products.service';
import { SeoService } from '@services/seo.service';
import { ShippingBusinessService } from '@services/shipping-business.service';
import { TenantService } from 'src/app/core/tenants/tenants.service';
import { Subscription } from 'rxjs';
import { ProductAttrService } from '@services/product-attr.service';

@Component({
    selector: 'app-product-detail',
    templateUrl: './product-detail.component.html',
    styleUrls: ['./product-detail.component.scss'],
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnDestroy {

  private tenantService = inject(TenantService);
  private URL_BUSINESS = this.tenantService.getCurrentBusiness().url; 
  private deliveryService = inject(DeliveryService);
  private productService = inject(ProductsService);
  private categoryService = inject(CategoriesService);
  private cartService = inject(CartService);
  private seoService = inject(SeoService);
  private businessShippingService = inject(ShippingBusinessService);
  private authService = inject(AuthService);
  private productAttrService = inject(ProductAttrService);

  //componentes vars
  product = this.productService.$currentProduct;
  mainImage: string = '';
  mainMedia = signal<{ type: 'image' | 'video', src: string }>({ type: 'image', src: '' });
  categories = this.categoryService.categoriesProductDetailSignal;
  categoriesNames = computed(()=> this.categories().map(category => category.url_name));;
  categoryIds = computed(()=> this.categories().map(category => category.id));

  bundlesArray = this.productService.productBundlesSignal;
  bundle: ProductBundle = {} as ProductBundle;

  //states
  cantProduct:number = 1;
  destroyRoute?:Subscription;
  isAddingToCart= signal<boolean>(false);
  isLogged = computed(()=> this.authService.isLoggedIn());
  shippingMehtods = this.businessShippingService.shippingMethodsSignal;

  deliveryData = this.deliveryService.deliveryDataSignal;
  localDeliveryData = signal<DeliveryModel | null>(null);
  methodSelected:number=0;
  isShowMethod = computed(() => this.localDeliveryData() !== null);

  //variants
  variantStock:number = -1;
  isConsulting = this.productAttrService.$isConsulting;
  priceVariant = 0;

constructor(private route: ActivatedRoute, private router: Router, @Inject(PLATFORM_ID) private platformId: Object ) {

  this.businessShippingService.getShippingMetphods();

  this.destroyRoute = this.route.paramMap.subscribe(params => {

    const param = params.get('param');

    if (!param) {
      return;
    }

    if (this.validateUuid(param)) {
      this.productService.getProduct(param, true);
    } else {
      this.productService.getProduct(param, false);
    }    

  });


  effect(() => {

    const delivery = this.deliveryData();

    if (delivery?.name) {
      this.localDeliveryData.set(delivery);
    }

  });


  effect(() => {

    const product = this.product();

    if (product.id===undefined) {
      return;
    }

    this.seoService.seoProductTags(this.URL_BUSINESS, product);

    //this.seoService.googleMerchantCenter(this.URL_BUSINESS, product);

    //this.seoService.updateMetaTags(product);

    this.setMainImage(product);

    this.cantProduct = 1;
    
    this.categoryService.getCategoriesByProductId(product.id);

    
  });

  effect(() => {

    if (this.product().id === undefined || this.categoryIds().length === 0 || this.product().stock===0) {
      return;
    }

    this.productService.getProductsBundles(
      this.product().id,
      this.categoryIds()
    );

  });
}

 onAttributesChanged(event: any) {
    //console.log(event);
    this.priceVariant = event.price_modifier;
    
    if(event.stock===0){
      this.variantStock = 0;
    }else{
      this.product().stock = event.stock;
      this.variantStock = -1;
    }

    this.isConsulting.set(false);
  }
  
  ngOnDestroy(): void {
  
    this.productService.$currentProduct.set({} as ProductModel);
    this.destroyRoute?.unsubscribe();

  }

  changeMainMedia(type: 'image' | 'video', src: string) {
    this.mainMedia.set({ type, src });
  }


  // Lógica para agregar al carrito

  addToCart(product: ProductModel) {

    if (this.isAddingToCart()) return;
    
    this.isAddingToCart.set(true);
    

    if (this.cantProduct > product.stock) {
      alert(`No se puede agregar más de ${product.stock} unidades de este producto.`);
      this.restCant();
      return;
    }

    const item: CartItemModel = {
      id: '',
      product_id: product.id,
      product_name: product.name,
      quantity: this.cantProduct,
      price: product.price,
      product_bundle: this.bundle
    };

    this.cartService.addToCart(item, this.isLogged());

    setTimeout(()=>{ //corrige error NG0100: Expression has changed after it was checked
        this.isAddingToCart.set(false);
        //console.log('time out 3000')
      },1000);
  
  }

  // Lógica para comprar directamente
  buyNow(product: ProductModel) {

    const item:CartItemModel = {
      id:'',
      product_id:product.id,
      product_name: product.name,
      quantity: this.cantProduct,
      price:product.price,
      product_bundle: this.bundle
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

  getDelivery(){

    if(this.methodSelected!=0){
      let price = (this.product().priceSale)?this.product().priceSale:this.product().price;

      this.deliveryService.getDeliveryDate(this.methodSelected,price);
    }else
      this.hideDeliveryData();
   
  }

  validateUuid(uuid: string): boolean {

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
  }



  onBundleSelected(bundle: ProductBundle|null): void {
   
    if(bundle!=null)
      this.bundle = bundle;
  }

  private hideDeliveryData() {
    this.localDeliveryData.set(null);
  }

  // En tu componente.ts
  scrollToBundles() {
    const element = document.querySelector('.bundles-container');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      // Efecto visual de destello
      element.classList.add('highlight-flash');
      setTimeout(() => {
        element.classList.remove('highlight-flash');
      }, 2000);
    }
  }

 private setMainImage(product: ProductModel){

      if (product.video?.code) {
      this.mainMedia.set({
        type: 'video',
        src: `https://www.youtube.com/embed/${this.product().video?.code}`
      });
    } else if (product.imgs?.length > 0) {
      this.mainMedia.set({
        type: 'image',
        src: product.imgs[0].img
      });
    } else {
      this.mainMedia.set({
        type: 'image',
        src: product.imgP
      });
    }

 }
  
}
