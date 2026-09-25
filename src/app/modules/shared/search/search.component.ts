import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ProductsService } from '@services/products.service';
import { ProductModel } from '@models/product.model';
import { Subject, Subscription, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

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
  isLoading = false;
  showDropdown = false;
  totalFound = 0;
  private searchSub?: Subscription;

  constructor(private productService: ProductsService) {}

  ngOnInit(): void {
    this.searchSub = this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap((term) => {
        if (!term || term.trim().length < 2) {
          this.searchResults = [];
          this.showDropdown = false;
          this.isLoading = false;
          this.totalFound = 0;
        } else {
          this.isLoading = true;
          this.showDropdown = true;
        }
      }),
      switchMap((term) => {
        if (!term || term.trim().length < 2) {
          return of({ data: [], total: 0, current_page: 1, per_page: 5, last_page: 1 });
        }
        return this.productService.searchProductObservable(term.trim(), 1, 5);
      })
    ).subscribe({
      next: (res: any) => {
        this.isLoading = false;
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

  search(): void {
    const inputValue = this.searchInput?.nativeElement.value || '';
    if (inputValue && inputValue.trim() !== '') {
      this.showDropdown = false;
      this.productService.goSearchPage(inputValue.trim(), 1);
    }
  }

  selectProduct(): void {
    this.showDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-search')) {
      this.showDropdown = false;
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.showDropdown = false;
  }
}
