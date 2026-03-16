import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: 'img[appImgLazy]'
})
export class ImgLazyLoadDirective implements OnInit{

  @Input() public max: number = 0;
  @Input() public count: number = 0;
  element:ElementRef | undefined;

  constructor( el:ElementRef) {
    this.element = el; 
  }
  ngOnInit(): void {
    
    if(this.count>this.max) {
      
      if(this.element!=undefined){
        return this.element.nativeElement.setAttribute('loading','lazy');
      }
        
  }
  }

}