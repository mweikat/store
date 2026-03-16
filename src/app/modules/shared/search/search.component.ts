import { Component, ElementRef, ViewChild } from '@angular/core';
import { ProductsService } from '@services/products.service';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrl: './search.component.scss',
    standalone: false
})
export class SearchComponent {

  @ViewChild('searchInput') searchInput!: ElementRef;

  constructor(private productService:ProductsService){}

  search(){

     // Obtiene el valor del input usando nativeElement.value
     const inputValue = this.searchInput.nativeElement.value;
     
     if(inputValue!=null && inputValue!=''){
      this.productService.goSearchPage(inputValue);
     }

  }

}
