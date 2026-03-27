"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useErrorMetrics = useErrorMetrics;
const react_1 = require("react");
const admin_analytics_1 = require("../api/admin-analytics");
function useErrorMetrics(timeRange = '24h') {
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        let mounted = true;
        async function fetchData() {
            try {
                setLoading(true);
                const result = await (0, admin_analytics_1.getErrorMetrics)(timeRange);
                if (mounted) {
                    setData(result.data);
                    setError(null);
                }
            }
            catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch error metrics');
                }
            }
            finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }
        fetchData();
        return () => {
            mounted = false;
        };
    }, [timeRange]);
    return { data, loading, error };
}
