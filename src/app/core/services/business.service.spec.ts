import { TestBed } from '@angular/core/testing';
import { BusinessService } from './business.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID, REQUEST } from '@angular/core';
import { environment } from 'src/environments/environment';

describe('BusinessService', () => {
  let service: BusinessService;
  let httpMock: HttpTestingController;

  describe('Browser environment tests', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          BusinessService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: REQUEST, useValue: null }
        ]
      });

      service = TestBed.inject(BusinessService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should return defaultBusinessName when hostname contains localhost', () => {
      spyOn(service, 'getNameHost').and.callThrough();
      const host = service.getNameHost();
      expect(typeof host).toBe('string');
    });

    it('should throw error when getBusinessHost is called with numeric domain string', (done) => {
      service.getBusinessHost('12345').subscribe({
        next: () => fail('Should have failed with numeric domain'),
        error: (err) => {
          expect(err.message).toContain('Invalid domain: numeric value provided');
          done();
        }
      });
    });

    it('should issue GET HTTP request for valid domain', () => {
      service.getBusinessHost('mipatita').subscribe((business) => {
        expect(business.name).toBe('Test Store');
      });

      const req = httpMock.expectOne(`${environment.api_business}/info/mipatita`);
      expect(req.request.method).toBe('GET');
      req.flush({ id: '1', name: 'Test Store', url: 'mipatita.cl', desc: 'Desc', info: {} as any });
    });
  });

  describe('SSR Server environment tests with request header', () => {
    let ssrService: BusinessService;

    beforeEach(() => {
      const mockRequest = {
        headers: new Map([['host', 'www.tiendassr.cl']])
      };
      (mockRequest.headers as any).get = (key: string) => {
        if (key === 'host') return 'www.tiendassr.cl';
        return null;
      };

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          BusinessService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: mockRequest }
        ]
      });

      ssrService = TestBed.inject(BusinessService);
    });

    it('should resolve hostname from SSR request header', () => {
      const host = ssrService.getNameHost();
      expect(host).toBe('tiendassr');
    });
  });

  describe('SSR Server environment tests without request header', () => {
    let ssrNoReqService: BusinessService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          BusinessService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: null }
        ]
      });

      ssrNoReqService = TestBed.inject(BusinessService);
    });

    it('should fallback to defaultBusinessName in SSR when request is missing', () => {
      const host = ssrNoReqService.getNameHost();
      expect(host).toBe(environment.defaultBusinessName);
    });
  });
});
