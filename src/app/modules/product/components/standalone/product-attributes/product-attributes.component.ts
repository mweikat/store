import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, Output } from '@angular/core';
import { ProductVariantSkuModel } from '@models/productVariantSku.model';
import { ProductAttrService } from '@services/product-attr.service';
import { ProductsService } from '@services/products.service';

@Component({
  selector: 'app-product-attributes',
  standalone: true,
  templateUrl: './product-attributes.component.html',
  styleUrl: './product-attributes.component.scss',
  imports:[CommonModule]
})
export class ProductAttributesComponent {

  private productAttrService = inject(ProductAttrService);
  private productService = inject(ProductsService);

  attributes = this.productAttrService.$productAttrArray;
  product = this.productService.$currentProduct;

  // Para cambiar imagen principal
  @Output() imageSelected = new EventEmitter<string>();

  // Para enviar selección final al padre
  @Output() attributesChanged = new EventEmitter<ProductVariantSkuModel>();

  selectedAttributes: any = {};
  private skuSelected = this.productAttrService.$skuSelected;
  stockVariant = this.productAttrService.$stockVariant;


  constructor(){

    effect(()=>{
      if(this.product().id){
        //console.log("1 paso", this.product().id);
        this.attributes.set([]);
        this.productAttrService.getProductAttrById(this.product().id);
      }
    });

    effect(()=>{

      if(this.attributes() && this.attributes().length>0){
        //console.log("2 paso si cant attr:", this.attributes());
        this.initializeDefaults();
      }else{
        //console.log('2 paso no cant attr: ', this.attributes());
      }
    });

    effect(()=>{
      if(this.skuSelected() && this.skuSelected().sku!=undefined){
        this.stockVariant.set(-1);
        this.productAttrService.getSkuAttrStock(this.skuSelected().sku);
      }
    });

    effect(()=>{
      if(this.stockVariant()!==-1){
        this.emitChanges();
      }
    });
  }
  
  initializeDefaults() {
    this.selectedAttributes = {};

    this.attributes()?.forEach(attr => {

      const defaultValue = attr.attr?.find((v: any) => v.default) || attr.attr?.[0];
      if (!defaultValue) {
        return;
      }

      this.selectedAttributes[attr.id] = defaultValue;

      /*if (attr.code === 'image' && defaultValue.image) {
        this.imageSelected.emit(defaultValue.image);
      }*/
    });

    this.getSkuSelected();
  }

  selectValue(attr: any, value: any) {

    this.selectedAttributes[attr.id] = value;
    //if (attr.type === 'image' && value.image) {
      //this.imageSelected.emit(value.image);
    //}

    this.getSkuSelected();
  }

  isSelected(attrId: number, valueId: string): boolean {
    return this.selectedAttributes[attrId]?.id === valueId;
    //return false;
  }

  getTotalModifier(): number {
    let total = 0;

    Object.values(this.selectedAttributes).forEach((value: any) => {
      total += value.priceModifier || 0;
    });

    return total;
    //return 0;
  }

  getSkuSelected(){
    if(this.selectedAttributes && Object.keys(this.selectedAttributes).length>0){

      const arrayIds: string[] = [];
      Object.values(this.selectedAttributes).forEach((element: any) => {
        arrayIds.push(element.id);
      });
      this.productAttrService.getSkuSelected(this.product().id, arrayIds);
    }
  }

  emitChanges() {
    this.skuSelected().stock = this.stockVariant();
    this.skuSelected().Items = Object.values(this.selectedAttributes);
    this.attributesChanged.emit(this.skuSelected());
  }
}
