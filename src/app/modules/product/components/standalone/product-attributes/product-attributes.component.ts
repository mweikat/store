import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ProductModel } from '@models/product.model';
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
  @Output() attributesChanged = new EventEmitter<any>();

  selectedAttributes: any = {};
  //attributes: any[] = [
  /*
    {
  id: 'color',
  name: 'Color',
  type: 'color',
  values: [
    {
      id: 'rojo',
      label: 'Rojo',
      color: '#ff0000',
      priceModifier: 0,
      default: true
    },
    {
      id: 'azul',
      label: 'Azul',
      color: '#0000ff',
      priceModifier: 1000,
      default: false
    },
    {
      id: 'verde',
      label: 'Verde',
      color: '#00aa00',
      priceModifier: 500,
      default: false
    }
  ]
},
  {
    id: 'talla',
    name: 'Talla',
    type: 'text',
    values: [
      {
        id: 'talla_15',
        label: '15 cm',
        priceModifier: -2000,
        default: false
      },
      {
        id: 'talla_23',
        label: '23 cm',
        priceModifier: 0,
        default: true
      },
      {
        id: 'talla_30',
        label: '30 cm',
        priceModifier: 3000,
        default: false
      }
    ]
  },
  
  {
    id: 'pack',
    name: 'Tipo de Pack',
    type: 'image',
    values: [
      {
        id: 'basico',
        label: 'Pack Básico',
        image: 'https://http2.mlstatic.com/D_NQ_NP_2X_915643-MLC103487546876_012026-F-zapatilla-escolar-unisex-pluma-plb018a.webp',
        priceModifier: 0,
        default: true
      },
      {
        id: 'premium',
        label: 'Pack Premium',
        image: 'https://via.placeholder.com/100?text=Premium',
        priceModifier: 5000,
        default: false
      },
      {
        id: 'deluxe',
        label: 'Pack Deluxe',
        image: 'https://via.placeholder.com/100?text=Deluxe',
        priceModifier: 9000,
        default: false
      }
    ]
  }
    */
//];
  constructor(){
    /*effect(()=>{
      if(this.attributes().length>0){
        console.log('cant attr: ', this.attributes());
        this.initializeDefaults();
      }
    });*/
  }
  ngOnChanges(changes: SimpleChanges): void {
    //console.log(changes['product'].currentValue.id)
    if (changes['product'].currentValue.id) {
      this.productAttrService.getProductAttrById(changes['product'].currentValue.id)
    }
  }

  initializeDefaults() {
    this.selectedAttributes = {};

    /*this.attributes()?.forEach(attr => {

      const defaultValue =
        attr.attr?.find((v: any) => v.default) ||
        attr.attr?[0];

      this.selectedAttributes[attr.id] = defaultValue;

      if (attr.code === 'image' && defaultValue.image) {
        //this.imageSelected.emit(defaultValue.image);
      }
    });

    this.emitChanges();*/
  }

  selectValue(attr: any, value: any) {

    this.selectedAttributes[attr.id] = value;

    if (attr.type === 'image' && value.image) {
      //this.imageSelected.emit(value.image);
    }

    this.emitChanges();
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

  emitChanges() {
    this.attributesChanged.emit({
      attributes: this.selectedAttributes,
      totalModifier: this.getTotalModifier()
    });
  }
}
