import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { ProductBundle } from '@models/productBundle.model';
import { SharedModule } from '@modules/shared/shared.module';
import { ProductsService } from '@services/products.service';

@Component({
  selector: 'app-product-bundles',
  standalone: true,
  templateUrl: './product-bundles.component.html',
  styleUrls: [
    './product-bundles.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:[CommonModule,SharedModule]
})
export class ProductBundlesComponent implements OnInit{

   // Inputs
  bundles = input.required<ProductBundle[]>();
  
  // Outputs
  bundleSelected = output<ProductBundle>();
  
  // Signals
  private productservice = inject(ProductsService);
  mainProduct = this.productservice.$currentProduct;

  selectedBundleId = signal<number | null>(null);
  hasFreeBundle = computed(() => 
    this.bundles().some(b => b.discount_type === 'free')
  );
  existsFree:boolean = false;

  selectedBundle = computed(() => {
    const selectedId = this.selectedBundleId();
    if (!selectedId) return null;
      return this.bundles().find(b => b.id === selectedId);
  });

  isSelectedBundleFree = computed(() => this.selectedBundle()?.discount_type === 'free');

  constructor(){
    effect(()=>{
      if(this.mainProduct()){
         if(!this.existsFree)
          this.cleanSelected();
      }
    });
  }
  
  ngOnInit() {
    // Seleccionar automáticamente si hay un solo bundle free
    const firstFreeBundle = this.bundles().find(b => b.discount_type === 'free');
      
      if (firstFreeBundle) {
        this.selectedBundleId.set(firstFreeBundle.id);
        this.bundleSelected.emit(firstFreeBundle);
        this.existsFree = true;
      }
  }
  
  selectBundle(bundle: ProductBundle): void {
    
    // Si ya está seleccionado, deseleccionar
    if(!this.existsFree)
    if (this.selectedBundleId() === bundle.id && bundle.discount_type != 'free') {
      this.cleanSelected();
      return;
    }
   //console.log('agrego prod', bundle); 
    // Seleccionar el nuevo bundle
    this.selectedBundleId.set(bundle.id);
    this.bundleSelected.emit(bundle);
    
  }
  
  getFinalPrice(bundle: ProductBundle): number {
    switch (bundle.discount_type) {
      case 'free':
        return 0;
      case 'percentage':
        return bundle.discount_price;
      case 'fixed':
        return bundle.discount_price;
      default:
        return bundle.selling_price;
    }
  }

  getDiscountPrice(bundle:ProductBundle){
    return bundle.selling_price*bundle.quantity - bundle.discount_price;
  }
  
  private cleanSelected(){

    this.selectedBundleId.set(null);
    this.bundleSelected.emit({} as ProductBundle);
  }



  
}
