import { ProductModel } from './product.model';

export interface CategoryProductsResponse {
  data: ProductModel[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}
