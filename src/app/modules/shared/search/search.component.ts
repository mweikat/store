import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ProductsService } from '@services/products.service';
import { ProductModel } from '@models/product.model';
import { Subject, Subscription, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

const RECENT_SEARCHES_KEY = 'recent_searches_list';
const MAX_RECENT_SEARCHES = 10;

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrl: './search.component.scss',
    standalone: false
})
export class SearchComponent implements OnInit, OnDestroy {

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchTerm$ = new Subject<string>();
  searchResults: ProductModel[] = [];
  recentSearches: string[] = [];
  isLoading = false;
  showDropdown = false;
  showRecentSearches = false;
  totalFound = 0;
  private searchSub?: Subscription;

  constructor(private productService: ProductsService) {}

  ngOnInit(): void {
    this.loadRecentSearches();

    this.searchSub = this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap((term) => {
        if (!term || term.trim().length < 3) {
          this.searchResults = [];
          this.isLoading = false;
          this.totalFound = 0;
          if (this.recentSearches.length > 0) {
            this.showRecentSearches = true;
            this.showDropdown = true;
          } else {
            this.showDropdown = false;
            this.showRecentSearches = false;
          }
        } else {
          this.isLoading = true;
          this.showRecentSearches = false;
          this.showDropdown = true;
        }
      }),
      switchMap((term) => {
        if (!term || term.trim().length < 3) {
          return of({ data: [], total: 0, current_page: 1, per_page: 5, last_page: 1 });
        }
        return this.productService.searchProductObservable(term.trim(), 1, 5);
      })
    ).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const currentInputValue = this.searchInput?.nativeElement.value || '';
        if (currentInputValue.trim().length < 3) {
          this.searchResults = [];
          this.totalFound = 0;
          if (this.recentSearches.length > 0) {
            this.showRecentSearches = true;
            this.showDropdown = true;
          } else {
            this.showDropdown = false;
            this.showRecentSearches = false;
          }
          return;
        }

        this.showRecentSearches = false;
        if (res && res.data && Array.isArray(res.data)) {
          this.searchResults = res.data;
          this.totalFound = res.total !== undefined ? res.total : res.data.length;
        } else if (Array.isArray(res)) {
          this.searchResults = res;
          this.totalFound = res.length;
        } else {
          this.searchResults = [];
          this.totalFound = 0;
        }
      },
      error: () => {
        this.isLoading = false;
        this.searchResults = [];
        this.totalFound = 0;
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm$.next(val);
  }

  onFocus(): void {
    const inputValue = this.searchInput?.nativeElement.value || '';
    if (inputValue.trim().length < 3) {
      this.loadRecentSearches();
      if (this.recentSearches.length > 0) {
        this.showRecentSearches = true;
        this.showDropdown = true;
      }
    } else {
      this.showRecentSearches = false;
      if (this.searchResults.length > 0 || this.isLoading) {
        this.showDropdown = true;
      }
    }
  }

  search(): void {
    const inputValue = this.searchInput?.nativeElement.value || '';
    if (inputValue && inputValue.trim() !== '') {
      const term = inputValue.trim();
      this.saveRecentSearch(term);
      this.showDropdown = false;
      this.showRecentSearches = false;
      this.productService.goSearchPage(term, 1);
    }
  }

  selectRecentSearch(term: string): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.value = term;
    }
    this.saveRecentSearch(term);
    this.showDropdown = false;
    this.showRecentSearches = false;
    this.productService.goSearchPage(term, 1);
  }

  removeRecentSearch(event: MouseEvent, term: string): void {
    event.stopPropagation();
    this.recentSearches = this.recentSearches.filter(t => t !== term);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(this.recentSearches));
    } catch (e) {
      // safe fallback
    }
    if (this.recentSearches.length === 0) {
      this.showRecentSearches = false;
      this.showDropdown = false;
    }
  }

  selectProduct(): void {
    const inputValue = this.searchInput?.nativeElement.value || '';
    if (inputValue && inputValue.trim() !== '') {
      this.saveRecentSearch(inputValue.trim());
    }
    this.showDropdown = false;
    this.showRecentSearches = false;
  }

  private loadRecentSearches(): void {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.recentSearches = parsed.slice(0, MAX_RECENT_SEARCHES);
        }
      }
    } catch (e) {
      this.recentSearches = [];
    }
  }

  private saveRecentSearch(term: string): void {
    if (!term || !term.trim()) return;
    const cleanTerm = term.trim();
    this.recentSearches = [
      cleanTerm,
      ...this.recentSearches.filter(t => t.toLowerCase() !== cleanTerm.toLowerCase())
    ].slice(0, MAX_RECENT_SEARCHES);

    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(this.recentSearches));
    } catch (e) {
      // safe fallback
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-search')) {
      this.showDropdown = false;
      this.showRecentSearches = false;
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.showDropdown = false;
    this.showRecentSearches = false;
  }
}
