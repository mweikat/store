import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { CategoryModel } from '@models/category.model';
import { CategoryHomeModel } from '@models/categoryHome.model';
import { ProductModel } from '@models/product.model';
import { ProductSearchResponse } from '@models/productSearchResponse.model';
import { Observable, Subject } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { environment } from 'src/environments/environment';
import { BusinessService } from './business.service';
import { StorageService } from './storage.service';
import { SearchPaginationState } from './products.service';

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

  private readonly CATEGORY_PRODUCTS_KEY = makeStateKey<ProductSearchResponse | ProductModel[]>('category_products');
  private readonly CATEGORY_PRODUCTS_KEY_PARAMS = makeStateKey<string>('category_products_params');
  private $categoryProducts = signal<ProductModel[]>([]);
  public readonly categoryProductsSignal = this.$categoryProducts.asReadonly();

  private $categoryProductsPagination = signal<SearchPaginationState>({ total: 0, current_page: 1, per_page: 12, last_page: 1 });
  public readonly categoryProductsPaginationSignal = this.$categoryProductsPagination.asReadonly();

  private $categoryProductsLoading = signal<boolean>(false);
  public readonly categoryProductsLoadingSignal = this.$categoryProductsLoading.asReadonly();

  private $categoryProductsError = signal<boolean>(false);
  public readonly categoryProductsErrorSignal = this.$categoryProductsError.asReadonly();
  
  constructor(private httpClient:HttpClient, private transferState: TransferState, @Inject(PLATFORM_ID) private platformId: Object, 
              private businessService: BusinessService,
              private storageService: StorageService) { }

  getHomeCat(ttl:string){
   
    if(isPlatformBrowser(this.platformId)){
      const storageKey = 'home_cat_' + this.businessService.getNameHost();
      const home_cat = this.transferState.get(this.HOME_CAT, []);
   
      if(home_cat.length>0){
        this.$homeCat.set(home_cat);
        this.transferState.remove(this.HOME_CAT);
        this.storageService.setWithExpiry(storageKey, home_cat, ttl);
        //console.log("Cargado desde cache con TransferState homecat", ttl);
       }else{

        const storedHomeCat = this.storageService.getWithExpiry<CategoryHomeModel[]>(storageKey);
        
        if (storedHomeCat) {
          this.$homeCat.set(storedHomeCat);
          //console.log("Cargado desde cache con StorageService homecat", ttl);
        }else
          this.getHomeCatCall(ttl);
       }
      
    }else
      this.getHomeCatCall(ttl);

  }

  private getHomeCatCall(ttl:string){

    this.httpClient.get <CategoryHomeModel[]>(`${this.URL}/category/imgs`).subscribe(receivedItem => {

      this.transferState.set(this.HOME_CAT, receivedItem);
      this.$homeCat.set(receivedItem);

      if(isPlatformBrowser(this.platformId)){

      }
    
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

  getCategoryProducts(slug: string, page: number = 1, perPage: number = 12, sort?: string | null, direction?: string | null, stock?: string | null) {
    if (!slug || !slug.trim()) {
      this.$categoryProducts.set([]);
      this.$categoryProductsPagination.set({ total: 0, current_page: 1, per_page: perPage, last_page: 1 });
      this.$categoryProductsLoading.set(false);
      this.$categoryProductsError.set(false);
      return;
    }

    const paramsKey = `${slug}_p${page}_pp${perPage}_s${sort || ''}_d${direction || ''}_st${stock || ''}`;

    if (isPlatformServer(this.platformId)) {
      this.getCategoryProductsCall(slug, page, perPage, sort, direction, stock, paramsKey);
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      const cachedResponse = this.transferState.get(this.CATEGORY_PRODUCTS_KEY, null);
      const cachedParamsKey = this.transferState.get(this.CATEGORY_PRODUCTS_KEY_PARAMS, '');

      if (cachedResponse !== null && cachedParamsKey === paramsKey) {
        this.processCategoryProductsResponse(cachedResponse, page, perPage);
        this.transferState.remove(this.CATEGORY_PRODUCTS_KEY);
        this.transferState.remove(this.CATEGORY_PRODUCTS_KEY_PARAMS);
        return;
      }

      this.getCategoryProductsCall(slug, page, perPage, sort, direction, stock, paramsKey);
    }
  }

  private getCategoryProductsCall(slug: string, page: number, perPage: number, sort?: string | null, direction?: string | null, stock?: string | null, paramsKey: string = '') {
    this.$categoryProductsLoading.set(true);
    this.$categoryProductsError.set(false);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (sort) {
      params = params.set('sort', sort);
    }
    if (direction) {
      params = params.set('direction', direction);
    }
    if (stock) {
      params = params.set('stock', stock);
    }

    const categoryProductsUrl = `${this.URL}/category-products/${encodeURIComponent(slug.trim())}`;

    this.httpClient.get<ProductSearchResponse | ProductModel[]>(categoryProductsUrl, { params })
      .subscribe({
        next: (response) => {
          this.transferState.set(this.CATEGORY_PRODUCTS_KEY, response);
          this.transferState.set(this.CATEGORY_PRODUCTS_KEY_PARAMS, paramsKey);
          this.processCategoryProductsResponse(response, page, perPage);
        },
        error: (err) => {
          if (err.status !== 404) {
            this.$categoryProductsError.set(true);
          }
          this.$categoryProductsLoading.set(false);
          this.$categoryProducts.set([]);
          this.$categoryProductsPagination.set({ total: 0, current_page: 1, per_page: perPage, last_page: 1 });
        }
      });
  }

  private processCategoryProductsResponse(response: ProductSearchResponse | ProductModel[], page: number, perPage: number) {
    this.$categoryProductsLoading.set(false);
    if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      const res = response as ProductSearchResponse;
      this.$categoryProducts.set(res.data || []);
      this.$categoryProductsPagination.set({
        total: res.total !== undefined ? res.total : (res.data ? res.data.length : 0),
        current_page: res.current_page || page,
        per_page: res.per_page || perPage,
        last_page: res.last_page || 1
      });
    } else if (Array.isArray(response)) {
      this.$categoryProducts.set(response);
      this.$categoryProductsPagination.set({
        total: response.length,
        current_page: 1,
        per_page: response.length || perPage,
        last_page: 1
      });
    } else {
      this.$categoryProducts.set([]);
      this.$categoryProductsPagination.set({ total: 0, current_page: 1, per_page: perPage, last_page: 1 });
    }
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
