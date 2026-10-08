import { BusinessInfoModel } from "./businessInfo.model";
import { BusinessPaymentsModel } from "./businessPayments.model";
import { BusinessRrssModel } from "./businessRrss.model";
import { BusinessShippingModel } from "./businessShipping.model";
import { SnackMessageModel } from "./snack_message.model";

export interface BusinessThemeColorsModel {
    primary?: string;
    primary_v1?: string;
    secondary?: string;
    tertiary?: string;
    quaternary?: string;
    quaternary_v2?: string;
    light_bg?: string;
    dark_text?: string;
    warning?: string;
    warning_v1?: string;
    price_color_1?: string;
    link_color?: string;
    invalid_form_color?: string;
}

export interface BusinessThemeTypographyModel {
    font_family_main?: string;
}

export interface BusinessThemeModel {
    colors?: BusinessThemeColorsModel;
    typography?: BusinessThemeTypographyModel;
}

export interface BusinessSettingsModel {
    template_key?: string;
    template_version?: string;
    theme?: BusinessThemeModel;
}

export interface BusinessModel {
    id:string;
    name:string;
    url:string;
    desc:string;
    info:BusinessInfoModel;
    settings?: BusinessSettingsModel;
}
