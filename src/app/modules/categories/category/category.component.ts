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

  // signals of categories & category products
  category = this.categoryService.categoryModelSignal;
  categoryProducts = this.categoryService.categoryProductsSignal;
  categoryPagination = this.categoryService.categoryProductsPaginationSignal;
  categoryLoading = this.categoryService.categoryProductsLoadingSignal;
  categoryError = this.categoryService.categoryProductsErrorSignal;

  // signals of search products & pagination from service
  productsSearchArray = this.productService.productModelArraySignal;
  searchPagination = this.productService.searchPaginationSignal;
  searchLoading = this.productService.searchLoadingSignal;
  searchError = this.productService.searchErrorSignal;
  
  // state vars
  displayProducts: ProductModel[] = [];

  flagsearch = true;
  isSearchMode = false;
  currentCategorySlug = '';

  queryParamSub?: Subscription;
  paramSub?: Subscription;
  private destroy$ = new Subject<void>();
  
  searchTerm = '';
  sortOption = '';
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;
  totalResults = 0;

  constructor(private route: ActivatedRoute) {

    this.paramSub = this.route.paramMap.subscribe(params => {
      //console.log("detecta cambio params: ");
      const category = params.get('category');
      if (category) {
        this.isSearchMode = false;
        if (this.currentCategorySlug !== category) {
          this.currentCategorySlug = category;
        }
        //this.categoryService.getCategoryByName([category]);
        const page = Number(this.route.snapshot.queryParamMap.get('page'))      || undefined;
        if (page===undefined){
          this.callToCategoryProducts(category, 1);
        }
        
      }
    });

    effect(() => {
      if (!this.isSearchMode && this.category().length > 0) {
        this.updateMetaTags(this.category()[0]);
      }
    });

    effect(() => {
      const items = this.categoryProducts();
      const pageState = this.categoryPagination();

      if (!this.isSearchMode) {
        this.currentPage = pageState.current_page;
        this.totalPages = pageState.last_page;
        this.totalResults = pageState.total;
        this.pageSize = pageState.per_page;
        this.displayProducts = items;
      }
    });

    effect(() => {
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
      
      if (params.keys.length === 0) {
        //console.log('No hay query params');
        return ;
      } 
      const term = params.get('term');
      const pageParam = params.get('page');
      const page = pageParam ? parseInt(pageParam, 10) : 1;

      if (term !== null) {
        this.isSearchMode = true;
        this.searchTerm = term;
        this.currentPage = page;
        this.seoService.setTitle(`Búsqueda: ${term}`);
        this.callToSearch(term, page);
      } else {
        const categorySlug = this.route.snapshot.paramMap.get('category') || this.currentCategorySlug;
        if (categorySlug) {
          this.isSearchMode = false;
          this.currentCategorySlug = categorySlug;
          this.currentPage = page;

          const sort = params.get('sort');
          const direction = params.get('direction');
          const stock = params.get('stock');
          const sortOptionParam = params.get('sortOption');

          if (sortOptionParam) {
            this.sortOption = sortOptionParam;
          } else if (sort === 'price' && direction === 'asc') {
            this.sortOption = 'priceAsc';
          } else if (sort === 'price' && direction === 'desc') {
            this.sortOption = 'priceDesc';
          } else if (sort === 'name' && direction === 'asc') {
            this.sortOption = 'name';
          } else if (sort === 'name' && direction === 'desc') {
            this.sortOption = 'nameDesc';
          } else if (sort === 'relevance') {
            this.sortOption = 'relevance';
          } else if (stock === 'available') {
            this.sortOption = 'stockAvailable';
          } else if (stock === 'out') {
            this.sortOption = 'stockOut';
          } else if (stock === 'all') {
            this.sortOption = 'stockAll';
          } else {
            this.sortOption = '';
          }
          if(this.sortOption.length>0)
            this.callToCategoryProducts(categorySlug, page);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.queryParamSub?.unsubscribe();
    this.paramSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isLoading(): boolean {
    return this.isSearchMode ? this.searchLoading() : this.categoryLoading();
  }

  get isError(): boolean {
    return this.isSearchMode ? this.searchError() : this.categoryError();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      if (this.isSearchMode) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { page: page },
          queryParamsHandling: 'merge'
        });
      } else {
        this.updateCategoryUrlQueryParams(page);
      }
    }
  }

  retry(): void {
    if (this.isSearchMode && this.searchTerm) {
      this.callToSearch(this.searchTerm, this.currentPage);
    } else if (!this.isSearchMode && this.currentCategorySlug) {
      this.callToCategoryProducts(this.currentCategorySlug, this.currentPage);
    }
  }

  retrySearch(): void {
    this.retry();
  }

  totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  applyFilters() {
    this.currentPage = 1;
    if (this.isSearchMode) {
      this.callToSearch(this.searchTerm, 1);
    } else if (this.currentCategorySlug) {
      this.updateCategoryUrlQueryParams(1);
    }
  }

  private updateCategoryUrlQueryParams(page: number) {
    const { sort, direction, stock } = this.getFilterParams();
    const queryParams: any = {};
    if (page > 1) {
      queryParams.page = page;
    }
    if (sort) {
      queryParams.sort = sort;
    }
    if (direction) {
      queryParams.direction = direction;
    }
    if (stock) {
      queryParams.stock = stock;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams
    });
  }

  private getFilterParams(): { sort: string | null, direction: string | null, stock: string | null } {
    let sort: string | null = null;
    let direction: string | null = null;
    let stock: string | null = null;

    if (this.sortOption === 'relevance') {
      sort = 'relevance';
    } else if (this.sortOption === 'name') {
      sort = 'name';
      direction = 'asc';
    } else if (this.sortOption === 'nameDesc') {
      sort = 'name';
      direction = 'desc';
    } else if (this.sortOption === 'priceAsc') {
      sort = 'price';
      direction = 'asc';
    } else if (this.sortOption === 'priceDesc') {
      sort = 'price';
      direction = 'desc';
    } else if (this.sortOption === 'stock' || this.sortOption === 'stockAvailable' || this.sortOption === 'available') {
      stock = 'available';
    } else if (this.sortOption === 'stockOut' || this.sortOption === 'out') {
      stock = 'out';
    } else if (this.sortOption === 'stockAll' || this.sortOption === 'all') {
      stock = 'all';
    }

    return { sort, direction, stock };
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

  private callToCategoryProducts(slug: string, page: number) {
    const { sort, direction, stock } = this.getFilterParams();
    this.categoryService.getCategoryProducts(slug, page, this.pageSize, sort, direction, stock);
  }

  private callToSearch(term: string, page: number) {
    const { sort, direction, stock } = this.getFilterParams();
    this.productService.searchProduct(term, page, this.pageSize, sort, direction, stock);
  }
}
