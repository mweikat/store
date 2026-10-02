import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentModel } from '@models/payment.model';

export interface PaymentProcessOutcome {
  success: boolean;
  requiresRedirect: boolean;
  redirectUrl?: string;
  orderNumber?: string;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentProcessorService {

  private readonly EXTERNAL_PAYMENT_CODES = ['khipu', 'webpay', 'webpay_plus', 'transbank', 'mercadopago', 'paypal'];

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  /**
   * Evaluates backend order creation response and determines payment execution path.
   */
  processPaymentResponse(payment: PaymentModel, resBody: any): PaymentProcessOutcome {
    if (!resBody || resBody.success === false) {
      return {
        success: false,
        requiresRedirect: false,
        errorMessage: resBody?.message || 'Error al procesar la orden'
      };
    }

    const paymentCode = (payment?.code || '').toLowerCase();
    const isExplicitlyNoRedirect = resBody.requires_redirect === false || paymentCode === 'pago_contra_entrega';

    // Extract redirect URL if available
    const redirectUrl = this.extractRedirectUrl(resBody);

    // Direct payment flow (e.g. pago_contra_entrega or explicit non-redirect)
    if (isExplicitlyNoRedirect || (!redirectUrl && !this.isExternalPaymentCode(paymentCode) && resBody.requires_redirect !== true)) {
      if (!resBody.order_number) {
        return {
          success: false,
          requiresRedirect: false,
          errorMessage: 'Número de orden no recibido'
        };
      }
      return {
        success: true,
        requiresRedirect: false,
        orderNumber: resBody.order_number
      };
    }

    // External payment flow with valid redirect URL
    if (redirectUrl) {
      return {
        success: true,
        requiresRedirect: true,
        redirectUrl: redirectUrl,
        orderNumber: resBody.order_number
      };
    }

    // Error case: External payment method without redirect URL
    return {
      success: false,
      requiresRedirect: false,
      errorMessage: 'No se obtuvo una URL de pago válida'
    };
  }

  /**
   * Executes navigation or external redirect according to outcome.
   */
  executeNavigation(outcome: PaymentProcessOutcome): boolean {
    if (!outcome.success) {
      return false;
    }

    if (outcome.requiresRedirect && outcome.redirectUrl) {
      if (isPlatformBrowser(this.platformId) && this.document?.location) {
        this.document.location.href = outcome.redirectUrl;
      }
      return true;
    }

    if (!outcome.requiresRedirect && outcome.orderNumber) {
      this.router.navigate(['/checkout/confirm', outcome.orderNumber]);
      return true;
    }

    return false;
  }

  private extractRedirectUrl(resBody: any): string | undefined {
    if (!resBody) return undefined;

    let url = resBody.redirect_url || resBody.url || resBody.payment_url;
    if (!url) return undefined;

    const token = resBody.token_ws || resBody.token;
    if (token && typeof url === 'string' && !url.includes('token_ws=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}token_ws=${token}`;
    }

    return url;
  }

  private isExternalPaymentCode(code: string): boolean {
    if (!code) return false;
    return this.EXTERNAL_PAYMENT_CODES.includes(code.toLowerCase());
  }
}
