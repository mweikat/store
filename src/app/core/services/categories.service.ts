import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { CategoryModel } from '@models/category.model';
import { CategoryHomeModel } from '@models/categoryHome.model';
import { Observable, Subject } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { environment } from 'src/environments/environment';

const CATEGORY_KEY = makeStateKey<CategoryModel>('category');

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  private readonly URL = environment.api_store;

  //private readonly businessCategories$: BehaviorSubject<CategoryModel[]> = new BehaviorSubject<CategoryModel[]>([]);
  //public readonly businessCategories: Observable<CategoryModel[]> = this.businessCategories$.asObservable();

  private readonly CATEGORY_KEY = makeStateKey<CategoryModel[]>('category');
  private readonly CATEGORY_NAME = makeStateKey<string>('categoryName');
  private $categoryModel = signal<CategoryModel[]>([]);
  public readonly categoryModelSignal = this.$categoryModel.asReadonly();

  private readonly CATEGORY_KEY_PROD_REL = makeStateKey<CategoryModel[]>('category');
  private $categoryModelProdRel = signal<CategoryModel[]>([]);
  public readonly categoryModelPtodRelSignal = this.$categoryModelProdRel.asReadonly();
  
  private readonly CATEGORY_HOME_1 = makeStateKey<CategoryModel>('category_home_1');
  private $categoryModelHome1 = signal<CategoryModel[]>([]);
  public readonly categoryModelHome1Signal = this.$categoryModelHome1.asReadonly(); 

  private readonly CATEGORY_HOME_2 = makeStateKey<CategoryModel>('category_home_2');
  private $categoryModelHome2 = signal<CategoryModel[]>([]);
  public readonly categoryModelHome2Signal = this.$categoryModelHome2.asReadonly(); 


  private readonly CATEGORIES_PROD_DETAILS = makeStateKey<CategoryModel[]>('categories_prod_detail');
  private readonly CATEGORIES_PROD_ID = makeStateKey<string>('categories_prod_id');
  //private readonly categoriesProductDetail$: Subject<CategoryModel[]> = new Subject();
  //public readonly categoriesProductDestail: Observable<CategoryModel[]> = this.categoriesProductDetail$.asObservable();
  private $categoriesProductDetail = signal<CategoryModel[]>([]);
  public readonly categoriesProductDetailSignal = this.$categoriesProductDetail.asReadonly(); 

  private readonly MENU_1 = makeStateKey<CategoryModel[]>('menu_1');
  private $menu1Categories = signal<CategoryModel[]>([]);
  public readonly menu1CategoriesSignal = this.$menu1Categories.asReadonly(); 

  private readonly HOME_CAT = makeStateKey<CategoryHomeModel[]>('home_cat');
  private $homeCat = signal<CategoryHomeModel[]>([]);
  public readonly homeCatSignal = this.$homeCat.asReadonly(); 
  
  constructor(private httpClient:HttpClient, private transferState: TransferState, @Inject(PLATFORM_ID) private platformId: Object) { }

  getHomeCat(){

    if(isPlatformServer(this.platformId))
      this.getHomeCatCall();
    
    if(isPlatformBrowser(this.platformId)){
      
      const home_cat = this.transferState.get(this.HOME_CAT, []);
   
      (home_cat.length>0)? this.$homeCat.set(home_cat) : this.getHomeCatCall();
      
    }

  }

  private getHomeCatCall(){

    this.httpClient.get <CategoryHomeModel[]>(`${this.URL}/category/imgs`).subscribe(receivedItem => {

      this.transferState.set(this.HOME_CAT, receivedItem);
      this.$homeCat.set(receivedItem);
    
    });

  }

  getMenu(position:string){

    if(isPlatformServer(this.platformId))
      this.getMenuCall(position);
    
    if(isPlatformBrowser(this.platformId)){
      
      const menu_1 = this.transferState.get(this.MENU_1, []);

      if(menu_1.length>0)
        this.$menu1Categories.set(menu_1);
      else
        this.getMenuCall(position);

    }

  }

  private getMenuCall(position:string){

    this.httpClient.get <CategoryModel[]>(`${this.URL}/category/menu/${position}`).subscribe(receivedItem => {

      this.transferState.set(this.MENU_1, receivedItem);
      this.$menu1Categories.set(receivedItem);
    
    });

  }

  getCategoryByPosition(position:string){

    if(isPlatformBrowser(this.platformId)){

      if(position=='HOME_1'){

        const cachedCategoryHome1 = this.transferState.get(this.CATEGORY_HOME_1, null);
        
        //console.log(cachedCategoryHome1);

        if(cachedCategoryHome1!=null){
          this.$categoryModelHome1.set([cachedCategoryHome1]);
          //this.transferState.remove(this.CATEGORY_HOME_1);
        }
        else
          this.getCategoryByPositionCall(position);
      }

      if(position=='HOME_2'){

        const cachedCategoryHome2 = this.transferState.get(this.CATEGORY_HOME_2, null);

        if(cachedCategoryHome2!=null){
          this.$categoryModelHome2.set([cachedCategoryHome2]);
          //this.transferState.remove(this.CATEGORY_HOME_2);
        }else
          this.getCategoryByPositionCall(position);
      }
    }else
      this.getCategoryByPositionCall(position);

  }

  private getCategoryByPositionCall(position:string){

    let dataToJson = {position:position};

    this.httpClient.post <CategoryModel[]>(`${this.URL}/category/position`,dataToJson).subscribe(receivedItem => {
      //console.log(receivedItem);
      
      if(position=='HOME_1'){
        this.transferState.set(this.CATEGORY_HOME_1, receivedItem[0]);
        this.$categoryModelHome1.set(receivedItem);

      }
      if(position=='HOME_2'){
        this.transferState.set(this.CATEGORY_HOME_2, receivedItem[0]);
        this.$categoryModelHome2.set(receivedItem);
      }      
    });

  }

  /*getCategoriesByBusinessId(){

    this.httpClient.get <CategoryModel[]>(`${this.URL}/categories/`+this.businessId).subscribe(receivedItem => {
      
      this.businessCategories$.next(receivedItem);
            
    });

  }*/

  getCategoryByName(categoryName:string[]){

    if(isPlatformServer(this.platformId)){
      this.getCategoryByNameCall(categoryName);
    }

    if(isPlatformBrowser(this.platformId)){

      const cachedCategory = this.transferState.get(this.CATEGORY_KEY, []);
      const cachedCatName  = this.transferState.get(this.CATEGORY_NAME, "");
      //console.log('entra a buscar las cat ', cachedCategory, cachedCatName, categoryName);
      if(cachedCategory.length>0 && cachedCatName==categoryName.join(' - ')){

        this.$categoryModel.set(cachedCategory);
        this.transferState.remove(this.CATEGORY_KEY);
        return ;
      }

      this.getCategoryByNameCall(categoryName);
      
    }

  }

  private getCategoryByNameCall(categoryName:string[]){

    const toJsonPost = {categoryNameUrls:categoryName}

    this.httpClient.post<CategoryModel[]>(`${this.URL}/categories/names`,toJsonPost).subscribe(receivedItem => {
      //console.log('api cat ', receivedItem );
      this.transferState.set(this.CATEGORY_KEY, receivedItem);
      this.transferState.set(this.CATEGORY_NAME, categoryName.join(' - '));
      this.$categoryModel.set(receivedItem);            
    });
    
  }

  getCategoryByNameProdRel(categoryName:string[]){

    if(isPlatformServer(this.platformId)){

      this.getCategoryByNameProdRelCall(categoryName);
      return;
    }

    if(isPlatformBrowser(this.platformId)){

      const cachedCategory = this.transferState.get(this.CATEGORY_KEY_PROD_REL, null);
      
      if(cachedCategory!=null && cachedCategory.length>0){
        this.$categoryModelProdRel.set(cachedCategory);
        this.transferState.remove(this.CATEGORY_KEY_PROD_REL);
        return ;
      }

      this.getCategoryByNameProdRelCall(categoryName);
      
    }

  }

  private getCategoryByNameProdRelCall(categoryName:string[]){

    const toJsonPost = {categoryNameUrls:categoryName};

     this.httpClient.post <CategoryModel[]>(`${this.URL}/categories/names`, toJsonPost).subscribe(receivedItem => {
      this.transferState.set(this.CATEGORY_KEY_PROD_REL, receivedItem);
      this.$categoryModelProdRel.set(receivedItem);            
    });
  }


  getCategoriesByProductId(productId:string){

    if(isPlatformServer(this.platformId)){

      this.getCategoriesByProductIdCall(productId);

    }

    if(isPlatformBrowser(this.platformId)){
      
      const cachedCategoryProDetail = this.transferState.get(this.CATEGORIES_PROD_DETAILS, []);
      const cachedCategoryProId = this.transferState.get(this.CATEGORIES_PROD_ID, '');

      if(cachedCategoryProDetail.length!=0 && productId==cachedCategoryProId){
        this.$categoriesProductDetail.set(cachedCategoryProDetail);
        this.transferState.remove(this.CATEGORIES_PROD_DETAILS);
      }else
        this.getCategoriesByProductIdCall(productId);

    }

  }

  private getCategoriesByProductIdCall(productId:string){

    this.httpClient.get <CategoryModel[]>(`${this.URL}/categories-product/`+productId).subscribe(items => {
      this.transferState.set(this.CATEGORIES_PROD_DETAILS, items);
      this.transferState.set(this.CATEGORIES_PROD_ID, productId);
      this.$categoriesProductDetail.set(items);
    });

  }

}
