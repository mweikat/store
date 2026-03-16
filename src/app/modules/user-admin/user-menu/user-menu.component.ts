import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-user-menu-admin',
    templateUrl: './user-menu.component.html',
    styleUrl: './user-menu.component.scss',
    standalone: false
})
export class UserMenuComponent implements OnInit {



  currentSection = '';

  constructor(private router: Router, ) {}

  ngOnInit(): void {

    

  }

  isActive(section: string): boolean {
    this.detectCurrentSection();
    return this.currentSection === section;
  }

  detectCurrentSection(): void {
    const url = this.router.url;
    if (url.includes('profile')) {
      this.currentSection = 'profile';
    } else if (url.includes('orders')) {
      this.currentSection = 'orders';
    } else if (url.includes('address')) {
      this.currentSection = 'address';
    }else if (url.includes('change-pass')) {
      this.currentSection = 'change-pass';
    }
  }


}