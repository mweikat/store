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
  pageSize = 12;
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
        this.productsCategory = this.deduplicateProducts(this.category()[0].products);
        this.totalResults = this.productsCategory.length;
        this.filterAndSortLocalProducts();
        this.updateMetaTags(this.category()[0]);
      }
    });

    effect(() => {
      if (this.isSearchMode) {
        const items = this.productsSearchArray();
        const pageState = this.searchPagination();
        
        this.productsCategory = this.deduplicateProducts(items);
        this.currentPage = pageState.current_page;
        this.totalPages = pageState.last_page;
        this.totalResults = pageState.total;
        this.pageSize = pageState.per_page;

        this.sortProducts();
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
        this.productService.searchProduct(term, page, this.pageSize);
      }
    });
  }

  ngOnDestroy(): void {
    this.queryParamSub?.unsubscribe();
    this.paramSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private deduplicateProducts(products: ProductModel[]): ProductModel[] {
    if (!products || !Array.isArray(products)) return [];
    const seen = new Set<string>();
    return products.filter(item => {
      if (!item || !item.id) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  filterProducts() {
    if (this.isSearchMode) {
      // En modo búsqueda por servidor, redirige o busca nueva página 1
      if (this.searchTerm.trim()) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { term: this.searchTerm, page: 1 },
          queryParamsHandling: 'merge'
        });
      }
    } else {
      this.filterAndSortLocalProducts();
    }
  }

  private filterAndSortLocalProducts() {
    this.filteredProducts = this.productsCategory.filter(product =>
      product.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.sortLocalProducts();
  }

  sortProducts() {
    if (this.isSearchMode) {
      const sorted = [...this.productsCategory];
      this.applySort(sorted);
      this.displayProducts = sorted;
    } else {
      this.sortLocalProducts();
    }
  }

  private sortLocalProducts() {
    const sorted = [...this.filteredProducts];
    this.applySort(sorted);
    this.filteredProducts = sorted;
    this.updateLocalPagination();
  }

  private applySort(arr: ProductModel[]) {
    if (this.sortOption === 'priceAsc') {
      arr.sort((a, b) => a.price - b.price);
    } else if (this.sortOption === 'priceDesc') {
      arr.sort((a, b) => b.price - a.price);
    } else if (this.sortOption === 'name') {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortOption === 'stock') {
      arr.sort((a, b) => b.stock - a.stock);
    }
  }

  private updateLocalPagination() {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.displayProducts = this.filteredProducts.slice(start, end);
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
        this.updateLocalPagination();
      }
    }
  }

  retrySearch(): void {
    if (this.isSearchMode && this.searchTerm) {
      this.productService.searchProduct(this.searchTerm, this.currentPage, this.pageSize);
    }
  }

  totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
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
}
