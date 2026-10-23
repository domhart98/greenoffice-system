import pool from "./db";

interface AuditLog {
    userId: number | null;
    action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "IMPORT" | "EXPORT";
    entityName: string;
    recordId?: number | null;
    description?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
}

export async function logAudit(data: AuditLog) {
    await pool.query(
        `
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_name,
            record_id,
            description,
            old_values,
            new_values,
            ip_address
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.userId,
            data.action,
            data.entityName,
            data.recordId ?? null,
            data.description ?? null,
            data.oldValues
                ? JSON.stringify(data.oldValues)
                : null,
            data.newValues
                ? JSON.stringify(data.newValues)
                : null,
            data.ipAddress ?? null,
        ]
    );
}