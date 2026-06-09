export interface WelcomeData {
    name: string;
    email: string;
    /** e.g. https://yoursite.com/login */
    loginUrl?: string;
    /** e.g. https://yoursite.com/shop */
    shopUrl?: string;
}
export declare function renderWelcome(data: WelcomeData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=welcome.d.ts.map