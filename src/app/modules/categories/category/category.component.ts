import { Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CategoryModel } from '@models/category.model';
import { ProductModel } from '@models/product.model';
import { CategoriesService } from '@services/categories.service';
import { ProductsService } from '@services/products.service';
import { SeoService } from '@services/seo.service';
import { distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';

@Component({
    selector: 'app-category',
    templateUrl: './category.component.html',
    styleUrl: './category.component.scss',
    standalone: false
})
export class CategoryComponent implements OnInit,OnDestroy {

  //services 
  private categoryService = inject(CategoriesService);
  private productService = inject(ProductsService);
  private seoService = inject(SeoService);

  //signals of categories
  category = this.categoryService.categoryModelSignal;
  //signals of search products
  productsSearchArray = this.productService.productModelArraySignal;
  
  //vars
  productsCategory : ProductModel[] = [];
  filteredProducts : ProductModel[] = [];
  paginatedProducts: ProductModel[] = [];

  flagsearch:boolean = true;

  queryParamSub?: Subscription;
  private destroy$ = new Subject<void>();
  
  searchTerm = '';
  sortOption = '';
  currentPage = 1;
  pageSize = 24;
  totalPages = 1;

  constructor(private route: ActivatedRoute) {

    this.route.paramMap.subscribe(params => {
    const category = params.get('category');
      if (category) {
        
        this.categoryService.getCategoryByName([category]);

      }
    });

    effect(()=>{
      //console.log('category effect', this.category().products);
      //this.products = this.productsArray();
      if(this.category().length>0 && this.category()[0].products!= undefined && this.category()[0].products.length>0){
        this.productsCategory = this.category()[0].products;
        this.filterProducts();
        this.updateMetaTags(this.category()[0]);
      }
    });

    const productsSearchArray$ = toObservable(this.productsSearchArray);
    productsSearchArray$.pipe(
      distinctUntilChanged(), // Evita llamadas duplicadas para el mismo valor
      takeUntil(this.destroy$) // Se completa cuando destroy$ emite
    ).subscribe(value => {
      
      if(value.length>0){
        
        this.productsCategory = value;
        this.filterProducts();
      }
    });
  }



  ngOnInit() {

    this.queryParamSub = this.route.queryParamMap.subscribe(params => {
      const term = params.get('term') || null;
      if (term) {
        //this.searchTerm = term;
        this.productService.searchProduct(term);
      }
    });

  }

  ngOnDestroy(): void {

    if(this.queryParamSub)
      this.queryParamSub.unsubscribe();
    this.destroy$.next(); // Emitimos para completar los observables
    this.destroy$.complete(); // Completamos el subject
  }

  filterProducts() {
    // Filtrar productos por el término de búsqueda
    this.filteredProducts = this.productsCategory.filter(product =>
      product.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.sortProducts();
    //this.updatePagination();
  }

  sortProducts() {
    // Ordenar los productos según la opción seleccionada
    if (this.sortOption === 'priceAsc') {
      this.filteredProducts.sort((a, b) => a.price - b.price);
    } else if (this.sortOption === 'priceDesc') {
        this.filteredProducts.sort((a, b) => b.price - a.price);
    } else if (this.sortOption === 'name') {
        this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if(this.sortOption === 'stock'){
        this.filteredProducts.sort((a, b) => b.stock - a.stock);
    }
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedProducts = this.filteredProducts.slice(start, end);

  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  private updateMetaTags(category: CategoryModel): void {
   
    this.seoService.setTitle(category.seoTitle+'');
    this.seoService.setCanonical();
    this.seoService.setMeta('description',category.seoDesc?category.seoDesc:'',);
    this.seoService.setIndexFallow();
    this.seoService.setMetaPropertie('og:title',category.seoTitle+'');
    this.seoService.setMetaPropertie('og:description',category.seoDesc?category.seoDesc:'');
    //this.seoService.setMetaPropertie('og:url',this.$meta_data().url);
    //this.seoService.setMetaPropertie('og:image',this.$meta_data().rrss_image);

    this.seoService.setMeta('twitter:title',category.seoTitle+'');
    this.seoService.setMeta('twitter:description',category.seoDesc?category.seoDesc:'');
    //this.seoService.setMeta('twitter:image',this.$meta_data().rrss_image);
    
  }
}
