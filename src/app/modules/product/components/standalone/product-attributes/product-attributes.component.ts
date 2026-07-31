import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ProductModel } from '@models/product.model';
import { ProductVariantSkuModel } from '@models/productVariantSku.model';
import { ProductAttrService } from '@services/product-attr.service';

@Component({
  selector: 'app-product-attributes',
  standalone: true,
  templateUrl: './product-attributes.component.html',
  styleUrl: './product-attributes.component.scss',
  imports:[CommonModule]
})
export class ProductAttributesComponent implements OnChanges {

  private productAttrService = inject(ProductAttrService);
  attributes = this.productAttrService.$productAttrArray;
  product = input.required<ProductModel>();

  // Para cambiar imagen principal
  @Output() imageSelected = new EventEmitter<string>();

  // Para enviar selección final al padre
  @Output() attributesChanged = new EventEmitter<ProductVariantSkuModel>();

  selectedAttributes: any = {};
  private skuSelected = this.productAttrService.$skuSelected;
  stockVariant = this.productAttrService.$stockVariant;

  constructor(){
    effect(()=>{
      if(this.attributes() && this.attributes().length>0){
        //console.log('cant attr: ', this.attributes());
        this.initializeDefaults();
      }
    });
    effect(()=>{
      //console.log("skuSelected ", this.skuSelected());
      if(this.skuSelected() && this.skuSelected().sku!=undefined){
        //console.log("sku seleccionados ", this.skuSelected());
        this.stockVariant.set(-1);
        this.productAttrService.getSkuAttrStock(this.skuSelected().sku);
      }
    });
    effect(()=>{
      if(this.stockVariant()!==-1){
        //console.log("stock variant ", this.skuSelected());
        //console.log("selectedAttributes: ", this.selectedAttributes);
        this.emitChanges();
      }
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    //console.log(changes['product'].currentValue.id)
    if (changes['product'].currentValue.id) {
      this.productAttrService.getProductAttrById(changes['product'].currentValue.id)
    }
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
    //console.log("selectedAttributes ", this.selectedAttributes);
    if(this.selectedAttributes && Object.keys(this.selectedAttributes).length>0){
      //console.log("entra");
      const arrayIds: string[] = [];
      Object.values(this.selectedAttributes).forEach((element: any) => {
        arrayIds.push(element.id);
      });
      this.productAttrService.getSkuSelected(this.product().id, arrayIds);
    }
  }

  emitChanges() {
    //console.log("emite ", this.skuSelected());
    this.skuSelected().stock = this.stockVariant();
    this.skuSelected().Items = Object.values(this.selectedAttributes);
    this.attributesChanged.emit(this.skuSelected());
  }
}
