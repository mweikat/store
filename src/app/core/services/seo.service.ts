import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, DOCUMENT } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ProductModel } from '@models/product.model';

@Injectable({
  providedIn: 'root'
})
export class SeoService { 

  constructor(@Inject(DOCUMENT) private _document: Document, 
              public title:Title,
              public meta:Meta,
              @Inject(PLATFORM_ID) private platformId: Object,
              @Inject(DOCUMENT) private document: Document) {
              
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

   updateMetaTags(product: ProductModel): void {
   
    this.setTitle(product.name);
    this.setCanonical();
    let metaDesc = product.meta_desc;

    this.setMeta('description',metaDesc);
    this.setIndexFallow();

    this.setMetaPropertie('og:title',product.name);
    this.setMetaPropertie('og:description',metaDesc);
    //this.seoService.setMetaPropertie('og:url',this.$meta_data().url);
    this.setMetaPropertie('og:image',product.imgs[0].img);

    this.setMeta('twitter:title',product.name);
    this.setMeta('twitter:description',metaDesc);
    this.setMeta('twitter:image',product.imgs[0].img);
      
  }

  googleMerchantCenter(businessUrl:string, product:ProductModel){
        
      if (isPlatformServer(this.platformId)) {

        const availability =  product.stock > 0    ? 'https://schema.org/InStock'    : 'https://schema.org/OutOfStock';
        let cleanDesc = null;
        if(product.descShort)
          cleanDesc = this.decodeHtml(product.descShort.replace(/<[^>]+>/g, ''));
        
        const images = product.imgs?.map(i => i.img) || [product.imgP];

        const schema = {

          '@context': 'https://schema.org/',
          '@type': 'Product',
          name: product.name,
          image: images,
          description: cleanDesc,
          sku: product.id,
          offers: {
            '@type': 'Offer',
            url: `https://${businessUrl}.cl/product/${product.url}`,
            priceCurrency: 'CLP',
            price: product.price,
            availability: availability,
          },
          "brand": 
          { 
            "@type": "Brand", 
            "name": product.brand 

          },
          "itemCondition": "https://schema.org/NewCondition"
        };

        this.insertSchema(schema);

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

}
