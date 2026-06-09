export interface LicenseDeliveredData {
    orderNumber: string;
    productName: string;
    /** Single key (use this or licenseKeys) */
    licenseKey?: string;
    /** Multiple keys for the same line item */
    licenseKeys?: string[];
    dashboardUrl?: string;
}
export declare function renderLicenseDelivered(data: LicenseDeliveredData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=licenseDelivered.d.ts.map