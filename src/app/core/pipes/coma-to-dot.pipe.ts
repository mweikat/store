import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'comaToDot',
    standalone: false
})
export class ComaToDotPipe implements PipeTransform {

  transform(value: any, ...args: unknown[]): unknown {
    if(value!=null)
      return value.toString().replace(',', '.');
    
    return value;
  }

}
