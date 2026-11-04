import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { PaymentProcessorService } from './payment-processor.service';
import { CartService } from './cart.service';
import { environment } from 'src/environments/environment';
import { PaymentModel } from '@models/payment.model';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;
  let paymentProcessorMock: jasmine.SpyObj<PaymentProcessorService>;
  let cartServiceMock: jasmine.SpyObj<CartService>;

  beforeEach(() => {
    paymentProcessorMock = jasmine.createSpyObj('PaymentProcessorService', ['processPaymentResponse', 'executeNavigation']);
    cartServiceMock = jasmine.createSpyObj('CartService', ['clearCart']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OrderService,
        { provide: PaymentProcessorService, useValue: paymentProcessorMock },
        { provide: CartService, useValue: cartServiceMock }
      ]
    });

    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('storeOrder should send correct payload for Tipo 1 (store_pickup)', () => {
    const payment = { id: 1, name: 'Webpay' } as PaymentModel;
    paymentProcessorMock.processPaymentResponse.and.returnValue({ success: true, redirectUrl: '/ok' } as any);

    service.storeOrder('cart-123', null, 5, payment, '+56911112222', {
      pickup_location_id: 10
    });

    const req = httpMock.expectOne(environment.api_order);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      business_shipping_id: 5,
      cart_id: 'cart-123',
      shipping_id: null,
      payment_id: 1,
      contact: '+56911112222',
      pickup_location_id: 10
    });

    req.flush({ order_id: 100 });
    expect(cartServiceMock.clearCart).toHaveBeenCalled();
  });

  it('storeOrder should send correct payload for Tipo 2 (local_delivery)', () => {
    const payment = { id: 2, name: 'Transferencia' } as PaymentModel;
    paymentProcessorMock.processPaymentResponse.and.returnValue({ success: true, redirectUrl: '/ok' } as any);

    service.storeOrder('cart-123', 'addr-99', 6, payment, '+56911112222');

    const req = httpMock.expectOne(environment.api_order);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      business_shipping_id: 6,
      cart_id: 'cart-123',
      shipping_id: 'addr-99',
      payment_id: 2,
      contact: '+56911112222'
    });

    req.flush({ order_id: 101 });
  });

  it('storeOrder should send correct payload for Tipo 4 (scheduled_local_delivery)', () => {
    const payment = { id: 1, name: 'Webpay' } as PaymentModel;
    paymentProcessorMock.processPaymentResponse.and.returnValue({ success: true, redirectUrl: '/ok' } as any);

    service.storeOrder('cart-123', 'addr-99', 7, payment, '+56911112222', {
      delivery_date: '2026-11-10',
      time_slot_id: 42
    });

    const req = httpMock.expectOne(environment.api_order);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      business_shipping_id: 7,
      cart_id: 'cart-123',
      shipping_id: 'addr-99',
      payment_id: 1,
      contact: '+56911112222',
      delivery_date: '2026-11-10',
      time_slot_id: 42
    });

    req.flush({ order_id: 102 });
  });

  it('storeOrder should handle HTTP 422 stock error', (done) => {
    const payment = { id: 1, name: 'Webpay' } as PaymentModel;

    service.noStockError.subscribe(err => {
      expect(err.errorCode).toBe('NO_STOCK');
      done();
    });

    service.storeOrder('cart-123', 'addr-99', 6, payment, '+56911112222');

    const req = httpMock.expectOne(environment.api_order);
    req.flush([{ errorCode: 'NO_STOCK', errorMessage: 'Sin stock', stockDetails: [] }], {
      status: 422,
      statusText: 'Unprocessable Entity'
    });
  });

  it('storeOrder should handle HTTP 422 schedule/quota availability error', (done) => {
    const payment = { id: 1, name: 'Webpay' } as PaymentModel;

    service.orderAvailabilityError.subscribe(msg => {
      expect(msg).toContain('Cupo agotado');
      done();
    });

    service.storeOrder('cart-123', 'addr-99', 7, payment, '+56911112222', {
      delivery_date: '2026-11-10',
      time_slot_id: 42
    });

    const req = httpMock.expectOne(environment.api_order);
    req.flush({ message: 'Cupo agotado para la franja seleccionada' }, {
      status: 422,
      statusText: 'Unprocessable Entity'
    });
  });
});
