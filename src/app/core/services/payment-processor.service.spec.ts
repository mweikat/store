import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PaymentModel } from '@models/payment.model';
import { PaymentProcessorService } from './payment-processor.service';

describe('PaymentProcessorService', () => {
  let service: PaymentProcessorService;
  let routerSpy: jasmine.SpyObj<Router>;
  let mockDocument: any;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    mockDocument = {
      location: {
        href: ''
      }
    };

    TestBed.configureTestingModule({
      providers: [
        PaymentProcessorService,
        { provide: Router, useValue: routerSpy },
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(PaymentProcessorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Khipu payment flow', () => {
    const khipuPayment: PaymentModel = { id: 1, name: 'Khipu', desc: 'Pago Khipu', code: 'khipu' };

    it('should process Khipu response with url and return external redirect outcome', () => {
      const response = {
        success: true,
        order_number: 'ORD-101',
        url: 'https://khipu.com/pay/123'
      };

      const outcome = service.processPaymentResponse(khipuPayment, response);

      expect(outcome.success).toBeTrue();
      expect(outcome.requiresRedirect).toBeTrue();
      expect(outcome.redirectUrl).toBe('https://khipu.com/pay/123');
      expect(outcome.orderNumber).toBe('ORD-101');
    });

    it('should process Khipu response with redirect_url', () => {
      const response = {
        success: true,
        order_number: 'ORD-102',
        redirect_url: 'https://khipu.com/pay/456'
      };

      const outcome = service.processPaymentResponse(khipuPayment, response);

      expect(outcome.success).toBeTrue();
      expect(outcome.requiresRedirect).toBeTrue();
      expect(outcome.redirectUrl).toBe('https://khipu.com/pay/456');
    });

    it('should return error outcome if Khipu response lacks payment url', () => {
      const response = {
        success: true,
        order_number: 'ORD-103'
      };

      const outcome = service.processPaymentResponse(khipuPayment, response);

      expect(outcome.success).toBeFalse();
      expect(outcome.errorMessage).toContain('URL de pago');
    });
  });

  describe('Webpay payment flow', () => {
    const webpayPayment: PaymentModel = { id: 2, name: 'Webpay', desc: 'Pago Webpay', code: 'webpay' };

    it('should process Webpay response with url and token_ws', () => {
      const response = {
        success: true,
        order_number: 'ORD-201',
        url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction',
        token_ws: '01ab23cd45ef'
      };

      const outcome = service.processPaymentResponse(webpayPayment, response);

      expect(outcome.success).toBeTrue();
      expect(outcome.requiresRedirect).toBeTrue();
      expect(outcome.redirectUrl).toBe('https://webpay3gint.transbank.cl/webpayserver/initTransaction?token_ws=01ab23cd45ef');
    });

    it('should process Webpay response with direct redirect_url', () => {
      const response = {
        success: true,
        order_number: 'ORD-202',
        requires_redirect: true,
        redirect_url: 'https://webpay3gint.transbank.cl/pay?token_ws=123'
      };

      const outcome = service.processPaymentResponse(webpayPayment, response);

      expect(outcome.success).toBeTrue();
      expect(outcome.requiresRedirect).toBeTrue();
      expect(outcome.redirectUrl).toBe('https://webpay3gint.transbank.cl/pay?token_ws=123');
    });
  });

  describe('Pago contra entrega flow', () => {
    const codPayment: PaymentModel = { id: 3, name: 'Pago contra entrega', desc: 'Efectivo', code: 'pago_contra_entrega' };

    it('should process pago_contra_entrega and return internal confirmation outcome without redirect', () => {
      const response = {
        success: true,
        order_number: 'ORD-301',
        requires_redirect: false
      };

      const outcome = service.processPaymentResponse(codPayment, response);

      expect(outcome.success).toBeTrue();
      expect(outcome.requiresRedirect).toBeFalse();
      expect(outcome.orderNumber).toBe('ORD-301');
      expect(outcome.redirectUrl).toBeUndefined();
    });

    it('should return error if order_number is missing for pago_contra_entrega', () => {
      const response = {
        success: true,
        requires_redirect: false
      };

      const outcome = service.processPaymentResponse(codPayment, response);

      expect(outcome.success).toBeFalse();
      expect(outcome.errorMessage).toContain('Número de orden');
    });
  });

  describe('Error & Edge cases', () => {
    const defaultPayment: PaymentModel = { id: 4, name: 'Transferencia', desc: 'Transferencia bancaria', code: 'transferencia' };

    it('should handle backend success = false', () => {
      const response = {
        success: false,
        message: 'Fondos insuficientes'
      };

      const outcome = service.processPaymentResponse(defaultPayment, response);

      expect(outcome.success).toBeFalse();
      expect(outcome.errorMessage).toBe('Fondos insuficientes');
    });

    it('should handle null response body', () => {
      const outcome = service.processPaymentResponse(defaultPayment, null);

      expect(outcome.success).toBeFalse();
      expect(outcome.errorMessage).toBeTruthy();
    });
  });

  describe('Navigation execution', () => {
    it('should set document.location.href when redirect is required', () => {
      const outcome = {
        success: true,
        requiresRedirect: true,
        redirectUrl: 'https://external-payment.com/pay'
      };

      const executed = service.executeNavigation(outcome);

      expect(executed).toBeTrue();
      expect(mockDocument.location.href).toBe('https://external-payment.com/pay');
    });

    it('should call router.navigate when internal confirmation is required', () => {
      const outcome = {
        success: true,
        requiresRedirect: false,
        orderNumber: 'ORD-999'
      };

      const executed = service.executeNavigation(outcome);

      expect(executed).toBeTrue();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/checkout/confirm', 'ORD-999']);
    });

    it('should return false if outcome is not successful', () => {
      const outcome = {
        success: false,
        requiresRedirect: false,
        errorMessage: 'Failed'
      };

      const executed = service.executeNavigation(outcome);

      expect(executed).toBeFalse();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });
});
