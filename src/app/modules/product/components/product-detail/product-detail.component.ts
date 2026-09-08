import { ChangeDetectionStrategy, Component, computed, effect, Inject, inject, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductModel } from '@models/product.model';
import { ProductBundle } from '@models/productBundle.model';
import { CategoriesService } from '@services/categories.service';

import { ProductsService } from '@services/products.service';
import { SeoService } from '@services/seo.service';
import { TenantService } from 'src/app/core/tenants/tenants.service';
import { Subscription } from 'rxjs';
import { ProductAttrService } from '@services/product-attr.service';
import { ProductVariantSkuModel } from '@models/productVariantSku.model';
import { isPlatformBrowser } from '@angular/common';

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
 
  private productService = inject(ProductsService);
  private categoryService = inject(CategoriesService);
  private seoService = inject(SeoService);

  private productAttrService = inject(ProductAttrService);
  //private isConsulting = this.productAttrService.$isConsulting;

  //componentes vars
  product = this.productService.$currentProduct;
  mainImage: string = '';
  mainMedia = signal<{ type: 'image' | 'video', src: string }>({ type: 'image', src: '' });
  categories = this.categoryService.categoriesProductDetailSignal;
  categoriesNames = computed(()=> this.categories().map(category => category.url_name));
  categoryIds = computed(()=> this.categories().map(category => category.id));

  bundlesArray = this.productService.productBundlesSignal;
  bundle: ProductBundle = {} as ProductBundle;

  //states
  destroyRoute?:Subscription;
  buttonsBlocked:boolean = true;
  //variants
  variantStock:number = -1;
  priceVariant = 0;
  variantCartItem :ProductVariantSkuModel|undefined = undefined;

constructor(private route: ActivatedRoute, @Inject(PLATFORM_ID) private platformId: Object ) {

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

    this.priceVariant = 0;    
    this.variantCartItem = undefined;
    this.variantStock= -1;

    if(isPlatformBrowser(this.platformId))
      this.buttonsBlocked= true;
    
    //console.log("entra primera vez cambia id ");
  
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

    //this.cantProduct = 1;
    
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
 
    //console.log("evento: ", event);
    if(event === null) {
      this.priceVariant = 0;
      this.variantStock = -1;
      this.variantCartItem = undefined;
     
    }else{
      this.priceVariant = event.price_modifier;
      this.variantCartItem = event;
      if(event.stock===0){
        this.variantStock = 0;
      }else{
        this.product().stock = event.stock;
        this.variantStock = -1;
      }
    }

    
    //this.buttonsBlocked = false;
    //event.quantity = this.cantProduct;
    //this.variantCartItem = event;
    if(isPlatformBrowser(this.platformId))
      this.buttonsBlocked=false;
    //console.log("habilita botones: ", this.buttonsBlocked);
  }
  
  ngOnDestroy(): void {
  
    this.productService.$currentProduct.set({} as ProductModel);
    this.destroyRoute?.unsubscribe();

  }

  changeMainMedia(type: 'image' | 'video', src: string) {
    this.mainMedia.set({ type, src });
  }


  validateUuid(uuid: string): boolean {

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
  }



  onBundleSelected(bundle: ProductBundle|null): void {
   
    if(bundle!=null)
      this.bundle = bundle;
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
      /*element.classList.add('highlight-flash');
      setTimeout(() => {
        element.classList.remove('highlight-flash');
      }, 2000);*/
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
