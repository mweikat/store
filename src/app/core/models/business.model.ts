import { BusinessInfoModel } from "./businessInfo.model";
import { BusinessPaymentsModel } from "./businessPayments.model";
import { BusinessRrssModel } from "./businessRrss.model";
import { BusinessShippingModel } from "./businessShipping.model";
import { SnackMessageModel } from "./snack_message.model";

export interface BusinessThemeColorsModel {
    primary?: string;
    primary_v1?: string;
    primary_dark?: string;
    secondary?: string;
    tertiary?: string;
    quaternary?: string;
    quaternary_v2?: string;
    quaternary_light?: string;
    light_bg?: string;
    bg_light?: string;
    dark_text?: string;
    text_dark?: string;
    warning?: string;
    warning_v1?: string;
    price_1?: string;
    price_2?: string;
    price_color_1?: string;
    price_sale?: string;
    link?: string;
    link_color?: string;
    invalid_form?: string;
    invalid_form_color?: string;
    check_fail?: string;
    card_list_total?: string;
    rgba_1?: string;
    rgba_2?: string;
    rgba_3?: string;
    rgba_4?: string;
}

export interface BusinessThemeTypographyModel {
    font_family_main?: string;
}

export interface BusinessThemeUIModel {
    card_radius?: string;
    card_shadow?: string;
}

export interface BusinessThemeModel {
    colors?: BusinessThemeColorsModel;
    typography?: BusinessThemeTypographyModel;
    ui?: BusinessThemeUIModel;
}

export interface BusinessThemeConfigWrapperModel {
    theme?: BusinessThemeModel;
}

export interface BusinessSettingsModel {
    template_key?: string;
    template_version?: string;
    theme_config?: BusinessThemeConfigWrapperModel;
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
