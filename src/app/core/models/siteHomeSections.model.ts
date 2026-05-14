
export interface SiteHomeSectionsModel {
    title:string,
    name:string;
    code:HomeSectionCode;
    desc:string;
    defer_strategy:'none' | 'immediate' | 'viewport' | 'idle' | 'when' | 'timer';
    defer_time:number|null;
    position:string;
    ttl:string;
}

export type HomeSectionCode =
  | 'slide'
  | 'photo-categories'
  | 'sale'
  | 'delivery'
  | 'brands'
  | 'sale2';