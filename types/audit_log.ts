export type AuditLog = {
    id?: number;
    userId: number | null;
    action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "IMPORT" | "EXPORT";
    entityName: string;
    recordId?: number | null;
    description?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
}