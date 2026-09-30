import { Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryModel } from '@models/category.model';
import { ProductModel } from '@models/product.model';
import { CategoriesService } from '@services/categories.service';
import { ProductsService } from '@services/products.service';
import { SeoService } from '@services/seo.service';
import { combineLatest, Subject, Subscription } from 'rxjs';

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
  private route = inject(ActivatedRoute);

  // signals of categories metadata
  category = this.categoryService.categoryModelSignal;

  // signals of search products & pagination from service
  productsSearchArray = this.productService.productModelArraySignal;
  searchPagination = this.productService.searchPaginationSignal;
  searchLoading = this.productService.searchLoadingSignal;
  searchError = this.productService.searchErrorSignal;

  // signals of category products & pagination from service
  categoryProductsArray = this.productService.categoryProductsArraySignal;
  categoryPagination = this.productService.categoryPaginationSignal;
  categoryLoading = this.productService.categoryLoadingSignal;
  categoryError = this.productService.categoryErrorSignal;

  // state vars
  isSearchMode = false;
  currentCategorySlug: string | null = null;
  searchTerm = '';
  sortOption = 'relevance';
  stockOption = 'all';
  pageSize = 12;

  private routeSub?: Subscription;
  private destroy$ = new Subject<void>();

  constructor() {
    effect(() => {
      const catList = this.category();
      if (!this.isSearchMode && catList && catList.length > 0) {
        this.updateMetaTags(catList[0]);
      }
    });
  }

  ngOnInit() {
    this.routeSub = combineLatest([
      this.route.paramMap,
      this.route.queryParamMap
    ]).subscribe(([paramMap, queryParamMap]) => {
      const categoryParam = paramMap.get('category');
      const termParam = queryParamMap.get('term');
      const pageParam = queryParamMap.get('page');
      const sortParam = queryParamMap.get('sort');
      const directionParam = queryParamMap.get('direction');
      const stockParam = queryParamMap.get('stock');

      const page = pageParam ? parseInt(pageParam, 10) : 1;
      const safePage = isNaN(page) || page < 1 ? 1 : page;

      // Sync sortOption from query params
      if (sortParam === 'price' && directionParam === 'asc') this.sortOption = 'priceAsc';
      else if (sortParam === 'price' && directionParam === 'desc') this.sortOption = 'priceDesc';
      else if (sortParam === 'name' && directionParam === 'asc') this.sortOption = 'nameAsc';
      else if (sortParam === 'name' && directionParam === 'desc') this.sortOption = 'nameDesc';
      else if (sortParam === 'relevance') this.sortOption = 'relevance';
      else this.sortOption = 'relevance';

      // Sync stockOption from query params
      if (stockParam === 'available') this.stockOption = 'available';
      else if (stockParam === 'out') this.stockOption = 'out';
      else this.stockOption = 'all';

      if (termParam !== null) {
        // Search Mode
        this.isSearchMode = true;
        this.currentCategorySlug = null;
        this.searchTerm = termParam;
        this.seoService.setTitle(`Búsqueda: ${termParam}`);

        const mappedSort = this.getMappedSort(this.sortOption);
        const mappedDirection = this.getMappedDirection(this.sortOption);
        const mappedStock = this.stockOption;

        this.productService.searchProduct(
          termParam,
          safePage,
          this.pageSize,
          mappedSort,
          mappedDirection,
          mappedStock
        );
      } else if (categoryParam && categoryParam !== 'search') {
        // Category Mode
        this.isSearchMode = false;
        this.currentCategorySlug = categoryParam;
        this.searchTerm = '';

        this.categoryService.getCategoryByName([categoryParam]);

        const mappedSort = this.getMappedSort(this.sortOption);
        const mappedDirection = this.getMappedDirection(this.sortOption);
        const mappedStock = this.stockOption;

        this.productService.getCategoryProducts(
          categoryParam,
          safePage,
          this.pageSize,
          mappedSort,
          mappedDirection,
          mappedStock
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get displayProducts(): ProductModel[] {
    return this.isSearchMode ? this.productsSearchArray() : this.categoryProductsArray();
  }

  get isLoading(): boolean {
    return this.isSearchMode ? this.searchLoading() : this.categoryLoading();
  }

  get isError(): boolean {
    return this.isSearchMode ? this.searchError() : this.categoryError();
  }

  get totalPages(): number {
    const pag = this.isSearchMode ? this.searchPagination() : this.categoryPagination();
    return pag.last_page || 1;
  }

  get currentPage(): number {
    const pag = this.isSearchMode ? this.searchPagination() : this.categoryPagination();
    return pag.current_page || 1;
  }

  get totalResults(): number {
    const pag = this.isSearchMode ? this.searchPagination() : this.categoryPagination();
    return pag.total || 0;
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: page },
        queryParamsHandling: 'merge'
      });
    }
  }

  applyFilters() {
    const mappedSort = this.getMappedSort(this.sortOption);
    const mappedDirection = this.getMappedDirection(this.sortOption);
    const mappedStock = this.stockOption;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 1,
        sort: mappedSort,
        direction: mappedDirection,
        stock: mappedStock
      },
      queryParamsHandling: 'merge'
    });
  }

  retrySearch(): void {
    if (this.isSearchMode && this.searchTerm) {
      const mappedSort = this.getMappedSort(this.sortOption);
      const mappedDirection = this.getMappedDirection(this.sortOption);
      const mappedStock = this.stockOption;

      this.productService.searchProduct(
        this.searchTerm,
        this.currentPage,
        this.pageSize,
        mappedSort,
        mappedDirection,
        mappedStock
      );
    }
  }

  retryCategory(): void {
    if (!this.isSearchMode && this.currentCategorySlug) {
      const mappedSort = this.getMappedSort(this.sortOption);
      const mappedDirection = this.getMappedDirection(this.sortOption);
      const mappedStock = this.stockOption;

      this.productService.getCategoryProducts(
        this.currentCategorySlug,
        this.currentPage,
        this.pageSize,
        mappedSort,
        mappedDirection,
        mappedStock
      );
    }
  }

  totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  private getMappedSort(sortOpt: string): string | null {
    if (sortOpt === 'priceAsc' || sortOpt === 'priceDesc') return 'price';
    if (sortOpt === 'nameAsc' || sortOpt === 'nameDesc') return 'name';
    if (sortOpt === 'relevance') return 'relevance';
    return null;
  }

  private getMappedDirection(sortOpt: string): string | null {
    if (sortOpt === 'priceAsc' || sortOpt === 'nameAsc') return 'asc';
    if (sortOpt === 'priceDesc' || sortOpt === 'nameDesc') return 'desc';
    return null;
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
