import { StockDetailsError } from "./stockDetailsError.model";

export interface ProductNStockError {

    errorCode: string,
    errorMessage: string,
    stockDetails: StockDetailsError[]
    
}