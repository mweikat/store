import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: 'img[appImgBroken]',
    standalone: false
})
export class ImgBrokenDirective {

    @HostListener('error') handleErrorImgBroken():void {
    const imgSelector = this.host.nativeElement

    imgSelector.src = 'assets/images/imgnodisp.webp'

  }
  //host se refiere al elemento referenciado que en este caso sería IMG 
  constructor(private host:ElementRef) {}

}