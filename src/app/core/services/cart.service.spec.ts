import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CartService } from './cart.service';
import { BusinessService } from './business.service';
import { MessagesService } from './messages.service';

describe('CartService', () => {
  let service: CartService;
  let mockBusinessService: any;
  let mockMessagesService: any;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    mockBusinessService = {
      getBusinessStorage: () => ({ id: 'test_biz_123' })
    };
    mockMessagesService = {
      sendMessage: jasmine.createSpy('sendMessage')
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CartService,
        { provide: Router, useValue: routerSpy },
        { provide: BusinessService, useValue: mockBusinessService },
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(CartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should clear cart signals and localStorage when clearCart is called', () => {
    localStorage.setItem('cart_test_biz_123', JSON.stringify({ id: 'c1', items: [{ id: 'i1' }] }));

    service.clearCart();

    expect(localStorage.getItem('cart_test_biz_123')).toBeNull();
    expect(service.$currentCartSignal().items).toEqual([]);
    expect(service.$cantCartSignal()).toBe(0);
    expect(service.$totalCartSignal()).toBe(0);
  });
});
