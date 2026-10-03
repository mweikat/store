import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { OrderModel } from '@models/order.model';
import { OrderService } from '@services/order.service';
import { Subscription } from 'rxjs';
import { OrderDetailsComponent } from '../order-details/order-details.component';
import { CartService } from '@services/cart.service';


@Component({
    selector: 'app-orders',
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss',
    standalone: false
})
export class OrdersComponent implements OnInit, OnDestroy {

  @ViewChild(OrderDetailsComponent) detailsComponent!: OrderDetailsComponent;

  destroyOrderList?:Subscription;
  destroyDetailsOrder?:Subscription;
  destroyShippedOrder?:Subscription;

  allOrders: OrderModel[] = [];
  orders: OrderModel[] = [];
  orderSelected:OrderModel = {} as OrderModel;
  showDetails:boolean = false;

  currentPage: number = 1;
  totalPages: number = 1;
  totalOrders: number = 0;
  perPage: number = 10;
  sortOption: string = 'created_at_desc';
  isServerPaginated: boolean = false;

  constructor(private orderService:OrderService, private cartService:CartService){}

  ngOnDestroy(): void {
    if(this.destroyOrderList)
      this.destroyOrderList.unsubscribe();
    if(this.destroyDetailsOrder)
      this.destroyDetailsOrder.unsubscribe();
    if(this.destroyShippedOrder)
      this.destroyShippedOrder.unsubscribe();
  }

  ngOnInit(): void {
   
    this.destroyOrderList = this.orderService.myOrders.subscribe( response => {
      if (!response) {
        this.orders = [];
        this.allOrders = [];
        this.totalOrders = 0;
        this.totalPages = 1;
        return;
      }

      if (Array.isArray(response)) {
        this.isServerPaginated = false;
        this.allOrders = response;
        this.totalOrders = this.allOrders.length;
        this.applyClientSideSortAndPagination();
      } else if (response && response.data) {
        this.isServerPaginated = true;
        this.orders = response.data;
        this.totalOrders = response.total !== undefined ? response.total : this.orders.length;
        this.currentPage = response.current_page || this.currentPage;
        this.perPage = response.per_page || this.perPage;
        this.totalPages = response.last_page || Math.ceil(this.totalOrders / this.perPage) || 1;
      }
    });

    this.fetchOrders();

    this.destroyDetailsOrder = this.orderService.orderDetails.subscribe( ordersItems =>{
      if(ordersItems!=undefined && ordersItems.length>0)
        this.orderSelected.items = ordersItems;
    });

    this.destroyShippedOrder = this.orderService.orderShipped.subscribe(shipped =>{
      if(shipped != undefined)
        this.orderSelected.shipped = shipped;
    });

  }

  fetchOrders(): void {
    const { sort, direction } = this.getSortParams();
    this.orderService.getMyOrderList(this.currentPage, this.perPage, sort, direction);
  }

  getSortParams(): { sort: string; direction: string } {
    switch (this.sortOption) {
      case 'created_at_asc':
        return { sort: 'created_at', direction: 'asc' };
      case 'total_amount_desc':
        return { sort: 'total_amount', direction: 'desc' };
      case 'total_amount_asc':
        return { sort: 'total_amount', direction: 'asc' };
      case 'created_at_desc':
      default:
        return { sort: 'created_at', direction: 'desc' };
    }
  }

  onSortChange(newSort: string): void {
    this.sortOption = newSort;
    this.currentPage = 1;
    if (this.isServerPaginated) {
      this.fetchOrders();
    } else {
      this.applyClientSideSortAndPagination();
    }
  }

  applyClientSideSortAndPagination(): void {
    const sorted = [...this.allOrders];

    sorted.sort((a, b) => {
      switch (this.sortOption) {
        case 'created_at_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'total_amount_desc':
          return (b.total_amount || 0) - (a.total_amount || 0);
        case 'total_amount_asc':
          return (a.total_amount || 0) - (b.total_amount || 0);
        case 'created_at_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    this.totalPages = Math.ceil(sorted.length / this.perPage) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.perPage;
    this.orders = sorted.slice(start, start + this.perPage);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    if (this.isServerPaginated) {
      this.fetchOrders();
    } else {
      this.applyClientSideSortAndPagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  get pagesArray(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  toggleDetails(order: OrderModel): void {
    
    //this.orderService.getOrderDetails(order.id);
    this.orderService.getShippedOrder(order.id);
    //this.orderSelected = {...order};
    this.orderSelected = order;
    this.showDetails = true;
    //console.log('order ', this.orderSelected);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'badge-success';
      case 'PENDING':
        return 'badge-warning';
      case 'PAID':
          return 'badge-success';
      case 'PENDING_VERIFICATION':
            return 'badge-warning';
      case 'SHIPPED':
          return 'badge-success';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return '';
    }
  }

  getTrackId(item: any, index: number): string {
    return item.id || item.product_id || `${index}-${item.name || 'item'}`;
  }

  hideDetails(){
    this.showDetails = false;
  }

  getTextVariant(texto:string){
    return this.cartService.extraerDatoVariant(texto);
  }
}
