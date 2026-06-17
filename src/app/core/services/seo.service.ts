import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, DOCUMENT, makeStateKey, TransferState } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ProductModel } from '@models/product.model';
import { ProductMetaModel } from '@models/productMeta.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly URL = environment.api_store;
  
  private readonly META_PRODUCT = makeStateKey<ProductMetaModel>('metaProduct');

  constructor(private httpClient:HttpClient,
              @Inject(DOCUMENT) private _document: Document, 
              public title:Title,
              public meta:Meta,
              @Inject(PLATFORM_ID) private platformId: Object,
              @Inject(DOCUMENT) private document: Document,
              private transferState: TransferState,) {
              
             }
  

  //uel oridinal de la pagina sin variables            
  setCanonical(url?:string){
    const canURL = url == undefined ? this._document.URL : url;
    const head = this._document.getElementsByTagName('head')[0];
    
    let element:HTMLLinkElement | null = this._document.querySelector(`link[rel='canonical']`)||null;

    if(!element){
      
      element  = this._document.createElement('link') as HTMLLinkElement;
      head.appendChild(element);
    }
    
    element.setAttribute('rel','canonical');
    element.setAttribute('href',canURL);
      
  }

  setTitle(newTitle: string) {

      this.title.setTitle(newTitle);
          
  }

  setMeta(name: string, content: string) {
    const existingMeta = this.meta.getTag(`name='${name}'`);
    
    if (existingMeta) {
      this.meta.updateTag({ name, content });
    } else {
      this.meta.addTag({ name, content });
    }
  }

  setMetaPropertie(prop:string, content:string){
    this.meta.updateTag({
      property: prop,
      content: content
    });
  }


  //si quiremos que la página sea indexada por los robots de busqueda          
  setIndexFallow(state:boolean = true){
   this.meta.updateTag({name:"robots", content:state?"index , follow" : "noindex , nofollow"}); 
  }

  setSiteName(siteName:string){
    this.meta.updateTag({property:"og:site_name", content:siteName}); 
  }

  
  insertSchema(schema: object): void {
    if (isPlatformServer(this.platformId)) {
      const script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      this.document.head.appendChild(script);
    }
  }

  updateFavicon(iconUrl: string) {
    
   if (!isPlatformBrowser(this.platformId)) return; // SSR safe

    const links: HTMLLinkElement[] = Array.from(
      this.document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')
    );

    links.forEach(link => {
      link.href = iconUrl;
    });

    // Si no existía, lo creamos
    if (links.length === 0) {
      const newLink = this.document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = iconUrl;
      this.document.head.appendChild(newLink);
    }
  }

   private updateMetaTags(product: ProductModel, metaModel:ProductMetaModel, url:string): void {
   
    const availability =  product.stock > 0    ? 'InStock'    : 'OutOfStock';
    let metaDesc = metaModel.meta_desc;

    this.setTitle(product.name);
    this.setCanonical();
    
    this.setMeta('description',metaDesc);
    this.setIndexFallow();

    this.setMetaPropertie('og:title',product.name);
    this.setMetaPropertie('og:description',metaDesc);
    this.setMetaPropertie('og:url',url);
    this.setMetaPropertie('og:type','product');
    this.setMetaPropertie('og:image',product.imgs[0].img);
    this.setMetaPropertie('og:price:amount',product.price+"");
    this.setMetaPropertie('og:price:currency','CLP');
    this.setMetaPropertie('og:availability',availability);
    
    this.setMetaPropertie('product:brand',product.brand?product.brand:"");

    this.setMeta('twitter:title',product.name);
    this.setMeta('twitter:description',metaDesc);
    this.setMeta('twitter:image',product.imgs[0].img);
      
  }

  private googleMerchantCenter(businessUrl:string, product:ProductModel, metaModel:ProductMetaModel){

        const availability =  product.stock > 0    ? 'https://schema.org/InStock'    : 'https://schema.org/OutOfStock';
        
        const images = product.imgs?.map(i => i.img) || [product.imgP];

        const url =  `https://${businessUrl}.cl/product/${product.url}`;

        const schema = {

          '@context': 'https://schema.org/',
          '@type': 'Product',
          name: product.name,
          image: images,
          description: metaModel.google_desc,
          sku: product.id,
          offers: {
            '@type': 'Offer',
            url: url,
            priceCurrency: 'CLP',
            price: product.price,
            availability: availability,
            itemCondition:"https://schema.org/NewCondition"
          },
          "brand": 
          { 
            "@type": "Brand", 
            "name": product.brand 

          },
          "itemCondition": "https://schema.org/NewCondition"
        };

        this.insertSchema(schema);

        this.updateMetaTags(product, metaModel, url);

      
  }

  seoProductTags(businessUrl:string, product:ProductModel){

    if(isPlatformServer(this.platformId)){
      this.seoProductTagsCall(businessUrl, product);
      return;
    }

    const meta_product = this.transferState.get(this.META_PRODUCT, null);
    
    if(!meta_product){
      //console.log('no hay meta tags llamo por lado cliente: ', meta_product)
      this.seoProductTagsCall(businessUrl, product);
      return;  
    }else{
      //console.log("si hay meta tag: ", meta_product);
      this.googleMerchantCenter(businessUrl, product, meta_product);    
      this.transferState.remove(this.META_PRODUCT);
      return;
    }

  }

  private seoProductTagsCall(businessUrl:string, product:ProductModel){

    this.httpClient.get <ProductMetaModel>(`${this.URL}/product-meta/${product.id}`).subscribe(receivedItem => {
      this.transferState.set(this.META_PRODUCT, receivedItem);
      this.googleMerchantCenter(businessUrl, product,receivedItem);
    },err => {
            
      console.log("Meta Error ", err);

          
    })

  }

  /*private decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  }*/

}
