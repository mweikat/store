import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortName'
})
export class ShortNamePipe implements PipeTransform {

  text:string='';

  transform(value: any, type:string): string {

    if(value!=null && value.length>20){

        switch (type) {
            case 'onWord':
                this.text = value.toString().split(' ')[0];
                break;
            case  'subString':
                this.text = value.toString().substring(0,20);    
                break;
            default :
                this.text = value;
        }

        return this.text+'...';
    }
      
    return value;
  }

}
