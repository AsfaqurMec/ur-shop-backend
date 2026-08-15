/** Checkout shipping option configured in admin settings. */
export interface ShippingMethod {
    id: string;
    title: string;
    subtitle: string;
    extraPrice: number;
}
/** Public floating social shortcuts (home FAB). Logo and link must be http(s) URLs. */
export interface SocialLink {
    id: string;
    /** Shown on the pill label (e.g. WhatsApp). */
    label: string;
    /** Image URL for the circular icon. */
    logo: string;
    /** Destination when the user taps the row. */
    link: string;
    /** Optional hex (e.g. #25D366) for pill + icon ring; defaults to primary when omitted. */
    accentColor?: string;
}
export interface StoreSettings {
    siteTitle: string;
    siteLogo: string;
    emailHeaderLogo: string;
    emailHeaderSlogan: string;
    emailHeaderSubtitle: string;
    emailFooterSupportEmail: string;
    emailFooterSupportNumber: string;
    storeName: string;
    contactEmail: string;
    address: string;
    currency: string;
    timezone: string;
    socialLinks: SocialLink[];
    shippingMethods: ShippingMethod[];
}
export declare const STORE_SETTINGS_KEY = "store_settings";
//# sourceMappingURL=storeSettings.d.ts.map