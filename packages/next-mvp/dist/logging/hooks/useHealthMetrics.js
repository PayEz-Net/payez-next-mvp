"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHealthMetrics = useHealthMetrics;
const react_1 = require("react");
const admin_analytics_1 = require("../api/admin-analytics");
function useHealthMetrics(timeRange = '1h') {
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        let mounted = true;
        async function fetchData() {
            try {
                setLoading(true);
                const result = await (0, admin_analytics_1.getHealthMetrics)(timeRange);
                if (mounted) {
                    setData(result.data);
                    setError(null);
                }
            }
            catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch health metrics');
                }
            }
            finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }
        fetchData();
        // Auto-refresh health metrics every minute
        const interval = setInterval(fetchData, 60000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [timeRange]);
    return { data, loading, error };
}
