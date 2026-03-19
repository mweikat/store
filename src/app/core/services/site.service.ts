import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { BusinessRrssModel } from '@models/businessRrss.model';
import { MetaDataModel } from '@models/metaData.model';
import { ParamModel } from '@models/param.model';
import { SiteBannerModel } from '@models/SiteBannerModel.model';
import { siteLogoModel } from '@models/siteLogo.model';
import { SiteSlideHomeModel } from '@models/siteSlideHome.model';
import { environment } from 'src/environments/environment';
import { SeoService } from './seo.service';
import { PageInfoModel } from '@models/pageInfo.model';
import { SiteHomeSectionsModel } from '@models/siteHomeSections.model';
import { BusinessService } from './business.service';

@Injectable({
  providedIn: 'root'
})
export class SiteService {

  private readonly URL = environment.api_store;
  private readonly ENV =  environment.production; 

  private readonly HOME_SECTIONS = makeStateKey<SiteHomeSectionsModel[]>('home_sections')
  private $homeSections = signal<SiteHomeSectionsModel[]>([]);
  public readonly homeSectionSignals= this.$homeSections.asReadonly();

  private readonly HOME_SLIDE = makeStateKey<SiteSlideHomeModel[]>('home_slide');
  private $homeSlide = signal<SiteSlideHomeModel[]>([]);
  public readonly homeSlideSignal = this.$homeSlide.asReadonly(); 

  private readonly HOME_RRSS = makeStateKey<BusinessRrssModel>('home_rrss');
  private $homeRrss = signal<BusinessRrssModel>({} as BusinessRrssModel);
  public readonly homeRrssSignal = this.$homeRrss.asReadonly(); 

  private readonly HOME_LOGOS = makeStateKey<siteLogoModel>('home_logos');
  private $homeLogos = signal<siteLogoModel>({} as siteLogoModel);
  public readonly homeLogosSignal = this.$homeLogos.asReadonly(); 

  private readonly TOP_1 = makeStateKey<SiteBannerModel>('top_1');
  private $top_1 = signal<SiteBannerModel>({} as SiteBannerModel);
  public readonly top_1Signal = this.$top_1.asReadonly();

  private readonly TOP_2 = makeStateKey<SiteBannerModel>('top_2');
  private $top_2 = signal<SiteBannerModel>({} as SiteBannerModel);
  public readonly top_2Signal = this.$top_2.asReadonly();
  
  private readonly GOOGLE_TM = makeStateKey<ParamModel>('google_tm');
  private $google_tm = signal<ParamModel>({} as ParamModel);

  private readonly META_DATA = makeStateKey<MetaDataModel>('meta_data');
  private $meta_data = signal<MetaDataModel>({} as MetaDataModel);

  private readonly PAGE_INFO = makeStateKey<PageInfoModel>('page_info');
  private $pageInfo = signal<PageInfoModel>({} as PageInfoModel);
  public readonly pageInfoSignal = this.$pageInfo.asReadonly(); 
   
  constructor(private httpClient:HttpClient, 
              private transferState: TransferState, 
              @Inject(PLATFORM_ID) private platformId: Object,
              private seoService:SeoService,
              private businessService:BusinessService
            ) {}

  getHomeRrss(){
  
    if(isPlatformServer(this.platformId))
      this.getHomeRrssCall();
    
    if(isPlatformBrowser(this.platformId)){
      
      const home_rrss = this.transferState.get(this.HOME_RRSS, {} as BusinessRrssModel);

      (home_rrss)? this.$homeRrss.set(home_rrss) : this.getHomeRrssCall();
      
    }

  }

  private getHomeRrssCall(){

      this.httpClient.get <BusinessRrssModel>(`${this.URL}/rrss`).subscribe(receivedItem => {

        this.transferState.set(this.HOME_RRSS, receivedItem);
        this.$homeRrss.set(receivedItem);
      
      });

  }

  async getHomeSlide() {

    if(isPlatformBrowser(this.platformId)) {
      const home_slide = this.transferState.get(this.HOME_SLIDE, []);
      
      if(home_slide.length != 0) {
        this.$homeSlide.set(home_slide);
        await sessionStorage.setItem('slides_'+this.businessService.getNameHost(),JSON.stringify(home_slide));
      } else {
        const carritoStorage = sessionStorage.getItem('slides');
        if(carritoStorage){
          this.$homeSlide.set(JSON.parse(carritoStorage));
        }else
          this.getHomeSlideCall();
      }
    } else {
      this.getHomeSlideCall();
    }
  }
  
  private getHomeSlideCall() {
    this.httpClient.get<SiteSlideHomeModel[]>(`${this.URL}/slides?time=${new Date().toString()}`).subscribe(receivedItem => {
      
      this.transferState.set(this.HOME_SLIDE, receivedItem);
      this.$homeSlide.set(receivedItem); // Usamos set() en lugar de next()
      
    });
  }

  getBanner(name:string){ 

    if(isPlatformBrowser(this.platformId)){

      if(name=="TOP_1"){
        
        const top_1 =  this.transferState.get(this.TOP_1, null);
      
        if(top_1==null)
          this.getBannerCall(name);
        else
          this.$top_1.set(top_1);
      
      }

      if(name=="TOP_2"){
        
        const top_2 =  this.transferState.get(this.TOP_2, null);
      
        if(top_2==null)
          this.getBannerCall(name);
        else
          this.$top_2.set(top_2);
      
      }

    }else
      this.getBannerCall(name);
    

  }

  getBannerCall(name:string){

    this.httpClient.get <SiteBannerModel>(`${this.URL}/banner/${name}`).subscribe(receivedItem => {
      
      if(receivedItem==null){
        this.transferState.set(makeStateKey<SiteBannerModel|null>(name), {img:"-1",text:"-1", link:"-1"} as SiteBannerModel)
        //console.log("seteamos -1", this.transferState.get(makeStateKey<SiteBannerModel|null>(name), null));
      }else

        if(name=="TOP_1"){
          this.transferState.set(this.TOP_1, receivedItem);
          this.$top_1.set(receivedItem);
        }

        if(name=="TOP_2"){
          this.transferState.set(this.TOP_2, receivedItem);
          this.$top_2.set(receivedItem);
        }
        
      
    });
    
  }
  
  getLogos(){
  
    if(isPlatformServer(this.platformId))
      this.getLogosCall();
    
    if(isPlatformBrowser(this.platformId)){
      
      const home_logos = this.transferState.get(this.HOME_LOGOS, {} as siteLogoModel);

      (home_logos)? this.$homeLogos.set(home_logos) : this.getLogosCall();
      
    }

  }

  private getLogosCall(){

      this.httpClient.get <siteLogoModel>(`${this.URL}/logos`).subscribe(receivedItem => {
        this.transferState.set(this.HOME_LOGOS, receivedItem);
        this.$homeLogos.set(receivedItem);
      
      });

  }

  setMetaData(){

    if(isPlatformServer(this.platformId))
      this.setMetaDataCall();
    else{
      const meta_data = this.transferState.get(this.META_DATA, {} as MetaDataModel);
      (meta_data)? this.$meta_data.set(meta_data) : this.getLogosCall();
      this.seoService.updateFavicon(meta_data.faicon);
    }

  }

  private setMetaDataCall(){

    this.httpClient.get <MetaDataModel>(`${this.URL}/meta-data`).subscribe(receivedItem => {
        this.transferState.set(this.META_DATA, receivedItem);
        this.$meta_data.set(receivedItem);
        this.injectMetaData();
    });

  }

  getPageInfo(page:string){

    if(isPlatformServer(this.platformId)){
      this.getPageInfoCall(page);
    }else{
      const page_info = this.transferState.get(this.PAGE_INFO,{} as PageInfoModel);
      (page_info && page_info.url==page)? this.$pageInfo.set(page_info) : this.getPageInfoCall(page);
    }
  }

  getHomeSections(){

    if(isPlatformServer(this.platformId)){
      this.getHomeSectionsCall();
    }else{

      const home_section = this.transferState.get(this.HOME_SECTIONS, []);
      
      if(home_section.length != 0) {
        this.$homeSections.set(home_section);
      } else {
        this.getHomeSectionsCall();
      }

    }
  }

  private getHomeSectionsCall(){

    this.httpClient.get<SiteHomeSectionsModel[]>(`${this.URL}/home-sections`).subscribe(receivedItem => {
      this.transferState.set(this.HOME_SECTIONS, receivedItem);
      this.$homeSections.set(receivedItem); // Usamos set() en lugar de next()
      
    });

  }

  private getPageInfoCall(page:string){

    this.httpClient.get <PageInfoModel>(`${this.URL}/site-info/${page}`).subscribe(receivedItem => {
        this.transferState.set(this.PAGE_INFO, receivedItem);
        this.$pageInfo.set(receivedItem);
        
    });

  }

  async setSiteGoogleTagManager(){

    if(this.ENV){
      
      if(isPlatformServer(this.platformId))
        this.setSiteGoogleTagManagerCall();
      else{
        
        const google_tm = this.transferState.get(this.GOOGLE_TM, {} as ParamModel);

        (google_tm)? this.$google_tm.set(google_tm) : await this.setSiteGoogleTagManagerCall();

        this.injectGtmScript(this.$google_tm().value);

      }


    }

  }

  private setSiteGoogleTagManagerCall(){

    this.httpClient.get <ParamModel>(`${this.URL}/gtm`).subscribe(receivedItem => {
        this.transferState.set(this.GOOGLE_TM, receivedItem);
        this.$google_tm.set(receivedItem);
      
      });
      
  }

  private injectGtmScript(gtmId: string): void {

    const script = document.createElement('script');
    script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');`;
    document.head.prepend(script);

    // También agregar el noscript
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
  height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.prepend(noscript);
  }

  private injectMetaData(){

    this.seoService.setTitle(this.$meta_data().index_title);
    this.seoService.setMeta('description',this.$meta_data().meta_description);

    this.seoService.setMetaPropertie('og:title',this.$meta_data().rrss_title);
    this.seoService.setMetaPropertie('og:description',this.$meta_data().rrss_desc);
    this.seoService.setMetaPropertie('og:url',this.$meta_data().url);
    this.seoService.setMetaPropertie('og:image',this.$meta_data().rrss_image);

    this.seoService.setMeta('twitter:title',this.$meta_data().rrss_title);
    this.seoService.setMeta('twitter:description',this.$meta_data().rrss_desc);
    this.seoService.setMeta('twitter:image',this.$meta_data().rrss_image);

    this.seoService.setCanonical(this.$meta_data().url);
    
  }


    
}
