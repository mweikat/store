import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'orderStatus',
    standalone: false
})
export class OrderStatus implements PipeTransform {

  transform(value: any, ...args: unknown[]): unknown {
    if(value!=null){
        
        switch(value){
            case 'PAID': return 'PAGADO';
            case 'COMPLETED': return 'COMPLETADO';
            case 'SHIPPED' : return 'DESPACHADO';
            case 'CANCELLED': return 'CANCELADO';
            case 'PENDING_VERIFICATION': return 'EN PREPARACIÓN';
            default : return 'NO RECONOCE ESTADO';
            
        }
    }

    return value;
  }

}