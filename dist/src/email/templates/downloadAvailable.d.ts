export interface DownloadAvailableData {
    orderNumber: string;
    productName: string;
    fileName: string;
    dashboardUrl?: string;
}
export declare function renderDownloadAvailable(data: DownloadAvailableData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=downloadAvailable.d.ts.map