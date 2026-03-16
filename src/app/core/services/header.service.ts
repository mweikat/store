import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  isMenu : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  isSearch : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  isUser : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  isCart : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  isToggleButton : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  constructor() { }



}
