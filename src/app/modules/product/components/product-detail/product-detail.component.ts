import { isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, Inject, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
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
import { distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';
import { TenantService } from 'src/app/core/tenants/tenants.service';


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

  //componentes vars
  product = this.productService.$currentProduct;
  private old_id:string ='';
  mainImage: string = '';
  mainMedia = signal<{ type: 'image' | 'video', src: string }>({ type: 'image', src: '' });
  categories = this.categoryService.categoriesProductDetailSignal;
  //categoriesNames = computed(()=>this.categories().map(category => category.url_name));
  categoriesNames:string[] = [];
  categoryIds = computed(()=> this.categories().map(category => category.id));

  bundlesArray = this.productService.productBundlesSignal;
  bundle: ProductBundle = {} as ProductBundle;

  //states
  cantProduct:number = 1;
  destroyRoute?:Subscription;
  isAddingToCart= signal<boolean>(false);
  isLogged = computed(()=> this.authService.isLoggedIn());
  shippingMehtods = this.businessShippingService.shippingMethodsSignal;
  private destroy$ = new Subject<void>();
  private destroy2$ = new Subject<void>();

  deliveryData = this.deliveryService.deliveryDataSignal;
  localDeliveryData = signal<DeliveryModel | null>(null);
  methodSelected:number=0;
  isShowMethod = computed(() => this.localDeliveryData() !== null);

  constructor(private route: ActivatedRoute,  private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {

      // Obtener el productId de la ruta y solicitar el producto
      this.destroyRoute = this.route.paramMap.subscribe(params => {
        const param = params.get('param');

        if(param){
          if (this.validateUuid(param)) {
            this.productService.getProduct(param,true);
            
          }else{
            this.productService.getProduct(param,false);
          }

          this.businessShippingService.getShippingMetphods();
        }
      });

    

      effect(()=>{

        if(this.deliveryData()?.name){
          this.localDeliveryData.set(this.deliveryData());
        }
        
      });

      const productObs$ = toObservable(this.product);
      const catgoriesObs$ = toObservable(this.categoryIds);
    
      // Nos suscribimos al observable
      productObs$.pipe(
        distinctUntilChanged(), // Evita llamadas duplicadas para el mismo valor
        takeUntil(this.destroy$) // Se completa cuando destroy$ emite
      ).subscribe(value => {
        //console.log('El valor cambió a:', value);
        if(this.product().id!=undefined && this.old_id!=this.product().id){
           this.old_id = this.product().id;
          this.updateMetaTags(this.product());
          this.setMainImage(this.product());
          this.categoryService.getCategoriesByProductId(this.product().id);
          this.cantProduct= 1;
        }
      });

      catgoriesObs$.pipe(
        distinctUntilChanged(), // Evita llamadas duplicadas para el mismo valor
        takeUntil(this.destroy2$) // Se completa cuando destroy$ emite
      ).subscribe(value => {
        //console.log('El valor cambió a:', value);
        if(this.categoryIds().length>0 && this.product().id!=undefined){
          this.productService.getProductsBundles(this.product().id,this.categoryIds());
          this.googleMerchantCenter();
        }
          
        this.categoriesNames =  this.categories().map(category => category.url_name);
      });

  }
  //attr
  selectedAttributes: any = {};
  totalModifier = 0;

 onAttributesChanged(event: any) {
    this.selectedAttributes = event.attributes;
    this.totalModifier = event.totalModifier;
  }
  
  ngOnDestroy(): void {
  
    this.productService.$currentProduct.set({} as ProductModel);
    this.destroy$.next(); // Emitimos para completar los observables
    this.destroy$.complete(); // Completamos el subject
    this.destroy2$.next(); 
    this.destroy2$.complete(); 


  }


  private googleMerchantCenter(){
        
      if (isPlatformServer(this.platformId)) {

        const availability =  this.product().stock > 0    ? 'https://schema.org/InStock'    : 'https://schema.org/OutOfStock';
        let cleanDesc = null;
        if(this.product().descShort)
          cleanDesc = this.decodeHtml(
    this.product().descShort.replace(/<[^>]+>/g, '')
  );
        
        const images = this.product().imgs?.map(i => i.img) || [this.product().imgP];

        const schema = {

          '@context': 'https://schema.org/',
          '@type': 'Product',
          name: this.product.name,
          image: images,
          description: cleanDesc,
          sku: this.product().id,
          offers: {
            '@type': 'Offer',
            url: `https://${this.URL_BUSINESS}.cl/product/${this.product().url}`,
            priceCurrency: 'CLP',
            price: this.product().price,
            availability: availability,
          },
          "brand": 
          { 
            "@type": "Brand", 
            "name": this.product().brand 

          },
          "itemCondition": "https://schema.org/NewCondition"
        };
        this.seoService.insertSchema(schema);

      }
  }

  private decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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

 private updateMetaTags(product: ProductModel): void {
   
  this.seoService.setTitle(product.name);
  this.seoService.setCanonical();
  let metaDesc = product.meta_desc;

  this.seoService.setMeta('description',metaDesc);
  this.seoService.setIndexFallow();

  this.seoService.setMetaPropertie('og:title',product.name);
  this.seoService.setMetaPropertie('og:description',metaDesc);
  //this.seoService.setMetaPropertie('og:url',this.$meta_data().url);
  this.seoService.setMetaPropertie('og:image',product.imgs[0].img);

  this.seoService.setMeta('twitter:title',product.name);
  this.seoService.setMeta('twitter:description',metaDesc);
  this.seoService.setMeta('twitter:image',product.imgs[0].img);
    
  }
  
}
