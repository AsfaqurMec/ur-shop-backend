export declare function create(data: {
    user_id: number | null;
    admin_id: number | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip: string | null;
}): Promise<number>;
//# sourceMappingURL=auditLogRepository.d.ts.map