import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, REQUEST } from '@angular/core';
import { BusinessModel } from '@models/business.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {

  private readonly URL = environment.api_business;
  private readonly defaultBusinessName = environment.defaultBusinessName;


  constructor(private httpClient:HttpClient, 

              @Inject(PLATFORM_ID) private platformId: Object,
              @Inject(REQUEST) private request: any
              ) { }


  
  getBusinessHost(domain:string):Observable<BusinessModel>{

    //console.log('localhost ', domain);

    return this.httpClient.get <BusinessModel>(`${this.URL}/info/${domain}`);

  }

  getNameHost(): string {
    
    let host=null;

    if (isPlatformBrowser(this.platformId)) {
      // En el cliente
      host = window.location.hostname;
      if (host && host.includes('localhost')) {
        return this.defaultBusinessName;
      }
      //console.log('host browser: ', host);
      // Eliminar "www."
      host = host.replace(/^www\./, '');
      // Quitar extensión (.cl, .com, etc.) → sólo deja ej "mipatita"
      let parts = host.split('.');
      host = parts.length > 1 ? parts[0] : host;

      return host;
    } else if (isPlatformServer(this.platformId) && this.request) {
      
      // En SSR con request disponible
      host = this.request.headers?.get('host');

      //console.log('host server: ', this.request.headers);

      // Eliminar "www."
      host = host.replace(/^www\./, '');
      // Quitar extensión (.cl, .com, etc.) → sólo deja ej "mipatita"
      let parts = host.split('.');
      host = parts.length > 1 ? parts[0] : host;

      if (host && host.includes('localhost')) {
        return this.defaultBusinessName;
      }
      return host || this.defaultBusinessName;;

    } else {
      // Fallback para SSR sin request
      return this.defaultBusinessName;
    }
  }

  /*setBusiness(business:BusinessInfoModel){

    localStorage.setItem('business', JSON.stringify(business));

  }*/

  /*getBusinessStorage():BusinessModel{
    const businessStorage = JSON.stringify(localStorage.getItem('business'));
    this.businessItem = businessStorage;
    return this.businessItem;

  }*/

  /*getBusinessByName(name:string){
    
    this.httpClient.get <BusinessModel>(`${this.URL}/${name}`).subscribe(receivedItem => {
      
      this.businessItem = receivedItem;
      
      //localStorage.setItem('business_type', this.businessItem.business_type);
      this.businessModel$.next(this.businessItem);
      
   //   this.getShippingMethods(this.businessItem.id);

    //  this.getPaymentsMethod(this.businessItem.id);
            
    }
    ,err => {
        if(err.status===404)
          this.go404(); 
        else
          if(err.status===503)
            this.goSuspended();
    }
    

    )*/

  /*getBusiness(name:string):Observable<BusinessModel>{
    
    return this.httpClient.get <BusinessModel>(`${this.URL}/${name}`);
  }*/



  /*getBusinessByName(name:string){
    
    this.httpClient.get <BusinessModel>(`${this.URL}/${name}`).subscribe(receivedItem => {
      
      this.businessItem = receivedItem;
      
      //localStorage.setItem('business_type', this.businessItem.business_type);
      this.businessModel$.next(this.businessItem);
      
   //   this.getShippingMethods(this.businessItem.id);

    //  this.getPaymentsMethod(this.businessItem.id);
            
    }
    ,err => {
        if(err.status===404)
          this.go404(); 
        else
          if(err.status===503)
            this.goSuspended();
    }
    

    )
  }*/

  /*

  goAdminPage(){
    window.location.href=this.adminUrl;
  }
  goRegisterPage(){
    window.location.href=this.registerUrl;
  }
  private getShippingMethods(id:string){
    
    this.httpClient.get <BusinessShippingModel>(`${this.URL}/shipping/${id}`).subscribe(receivedItem => {
      
      this.businessItem.shipping = receivedItem;
      this.businessModel$.next(this.businessItem);
      
           
    })
  }

  private getPaymentsMethod(id:string){

    this.httpClient.get <BusinessPaymentsModel>(`${this.URL}/payments/${id}`).subscribe(receivedItem => {
      
      this.businessItem.payments = receivedItem;
      this.businessModel$.next(this.businessItem);
      
           
    })
  }*/



  /*private  go404(){
    this.router.navigate(['/404'])
  }

  private goSuspended(){
    this.router.navigate(['/suspended']);
  }*/


}
