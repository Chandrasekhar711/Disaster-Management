import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { incidentService } from '../services/api.js';
import { Card } from '../components/common.jsx';
import { toast } from 'react-toastify';

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await incidentService.getStatistics();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  const COLORS = ['#0ea5e9', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics & Statistics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <div className="text-4xl font-bold text-primary-600">{stats?.total || 0}</div>
          <p className="text-gray-600 mt-2">Total Incidents</p>
        </Card>
        <Card className="text-center">
          <div className="text-4xl font-bold text-alert-600">{stats?.sosAlerts || 0}</div>
          <p className="text-gray-600 mt-2">SOS Alerts</p>
        </Card>
        <Card className="text-center">
          <div className="text-4xl font-bold text-green-600">{stats?.resolved || 0}</div>
          <p className="text-gray-600 mt-2">Resolved</p>
        </Card>
        <Card className="text-center">
          <div className="text-4xl font-bold text-purple-600">
            {stats?.total > 0
              ? Math.round((stats?.resolved / stats?.total) * 100)
              : 0}%
          </div>
          <p className="text-gray-600 mt-2">Resolution Rate</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Incidents by Type */}
        <Card>
          <h2 className="text-lg font-bold mb-4">Incidents by Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.byType || []}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
              >
                {stats?.byType?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Incidents by Status */}
        <Card>
          <h2 className="text-lg font-bold mb-4">Incidents by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.byStatus || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Severity Distribution */}
      <Card>
        <h2 className="text-lg font-bold mb-4">Incidents by Severity</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats?.bySeverity || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
