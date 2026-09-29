import { Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryModel } from '@models/category.model';
import { ProductModel } from '@models/product.model';
import { CategoriesService } from '@services/categories.service';
import { ProductsService } from '@services/products.service';
import { SeoService } from '@services/seo.service';
import { Subject, Subscription } from 'rxjs';

@Component({
    selector: 'app-category',
    templateUrl: './category.component.html',
    styleUrl: './category.component.scss',
    standalone: false
})
export class CategoryComponent implements OnInit, OnDestroy {

  // services
  private categoryService = inject(CategoriesService);
  public productService = inject(ProductsService);
  private seoService = inject(SeoService);
  private router = inject(Router);

  // signals of categories
  category = this.categoryService.categoryModelSignal;
  // signals of search products & pagination from service
  productsSearchArray = this.productService.productModelArraySignal;
  searchPagination = this.productService.searchPaginationSignal;
  searchLoading = this.productService.searchLoadingSignal;
  searchError = this.productService.searchErrorSignal;
  
  // state vars
  productsCategory: ProductModel[] = [];
  filteredProducts: ProductModel[] = [];
  displayProducts: ProductModel[] = [];

  flagsearch = true;
  isSearchMode = false;

  queryParamSub?: Subscription;
  paramSub?: Subscription;
  private destroy$ = new Subject<void>();
  
  searchTerm = '';
  sortOption = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalResults = 0;

  constructor(private route: ActivatedRoute) {

    this.paramSub = this.route.paramMap.subscribe(params => {
      const category = params.get('category');
      if (category) {
        this.isSearchMode = false;
        this.categoryService.getCategoryByName([category]);
      }
    });

    effect(() => {
      if (!this.isSearchMode && this.category().length > 0 && this.category()[0].products != undefined && this.category()[0].products.length > 0) {
        this.totalResults = this.productsCategory.length;
        this.updateMetaTags(this.category()[0]);
        this.displayProducts = this.category()[0].products;
      }
    });

    effect(() => {
      // Read signals unconditionally so Angular tracks them as dependencies from the start
      const items = this.productsSearchArray();
      const pageState = this.searchPagination();

      if (this.isSearchMode) {
        this.currentPage = pageState.current_page;
        this.totalPages = pageState.last_page;
        this.totalResults = pageState.total;
        this.pageSize = pageState.per_page;
        this.displayProducts = items;
      }
    });
  }

  ngOnInit() {
    this.queryParamSub = this.route.queryParamMap.subscribe(params => {
      const term = params.get('term');
      const pageParam = params.get('page');
      const page = pageParam ? parseInt(pageParam, 10) : 1;

      if (term !== null) {
        this.isSearchMode = true;
        this.searchTerm = term;
        this.currentPage = page;
        this.seoService.setTitle(`Búsqueda: ${term}`);
        this.callToSearch(term, page);
      }
    });
  }

  ngOnDestroy(): void {
    this.queryParamSub?.unsubscribe();
    this.paramSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      if (this.isSearchMode) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { page: page },
          queryParamsHandling: 'merge'
        });
      } else {
        this.currentPage = page;
      }
    }
  }

  retrySearch(): void {
    if (this.isSearchMode && this.searchTerm) {
      this.callToSearch(this.searchTerm, this.currentPage);
    }
  }

  totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  applyFilters(){

    if(this.isSearchMode)
      this.callToSearch(this.searchTerm, 1);
  }

  private updateMetaTags(category: CategoryModel): void {
    this.seoService.setTitle(category.seoTitle + '');
    this.seoService.setCanonical();
    this.seoService.setMeta('description', category.seoDesc ? category.seoDesc : '');
    this.seoService.setIndexFallow();
    this.seoService.setMetaPropertie('og:title', category.seoTitle + '');
    this.seoService.setMetaPropertie('og:description', category.seoDesc ? category.seoDesc : '');
    this.seoService.setMeta('twitter:title', category.seoTitle + '');
    this.seoService.setMeta('twitter:description', category.seoDesc ? category.seoDesc : '');
  }
  private callToSearch(term:string, page:number){

    let sort = null;
    let direction = null;
    let stock = null;
    
    if(this.sortOption==='name'){
      sort="name";
      direction="asc";
      stock="all";
    }
    if(this.sortOption==='priceAsc'){
      sort="price";
      direction="asc";
      stock="all";
    }
    if(this.sortOption==='priceDesc'){
      sort="price";
      direction="desc";
      stock="all";
    }
    if(this.sortOption==='stock'){
      stock="available";
    }

    this.productService.searchProduct(term, page, this.pageSize, sort, direction, stock);
  }
}
