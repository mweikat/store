export interface ProductSearchResponse {
  data: import('./product.model').ProductModel[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}
