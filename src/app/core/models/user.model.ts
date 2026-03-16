export interface UserModel {
    "id": string;
    "name": string;
    "lastName": string;
    "email": string;
    "email_verified_at"?: string;
    "password":string;
    "password_confirmation"?:string;
    "recaptcha":string;
    "business_id":string;
    "phone":string;
    "g_user"?:string;
}