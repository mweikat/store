import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { TenantService } from '../tenants/tenants.service';

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

}
