import type { ShippingMethod, StoreSettings } from '../types/storeSettings';
export declare function getStoreSettings(): Promise<StoreSettings>;
export declare function updateStoreSettings(patch: Partial<StoreSettings>): Promise<StoreSettings>;
export declare function getPublicStoreSettings(): Promise<Pick<StoreSettings, 'siteTitle' | 'siteLogo' | 'emailHeaderLogo' | 'emailHeaderSlogan' | 'emailHeaderSubtitle' | 'emailFooterSupportEmail' | 'emailFooterSupportNumber' | 'contactEmail' | 'socialLinks' | 'shippingMethods'>>;
export declare function findShippingMethodById(methods: ShippingMethod[], id: string): ShippingMethod | undefined;
export declare function getStoreSettingsSnapshot(): StoreSettings;
//# sourceMappingURL=storeSettingsService.d.ts.map