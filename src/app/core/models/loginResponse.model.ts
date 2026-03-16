import { UserModel } from "./user.model";

export interface LoginResponseModel {

    user: UserModel;
    access_token:string;
    
}
