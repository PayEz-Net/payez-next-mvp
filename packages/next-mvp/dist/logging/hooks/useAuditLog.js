"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuditLog = useAuditLog;
const react_1 = require("react");
const audit_log_1 = require("../api/audit-log");
function useAuditLog() {
    const [writing, setWriting] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    async function log(entry) {
        try {
            setWriting(true);
            setError(null);
            await (0, audit_log_1.writeAuditLog)(entry);
        }
        catch (err) {
            const errMessage = err instanceof Error ? err.message : 'Failed to write audit log';
            setError(errMessage);
            throw err;
        }
        finally {
            setWriting(false);
        }
    }
    return { log, writing, error };
}
