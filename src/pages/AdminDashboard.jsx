import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Database,
  Server,
  Globe
} from 'lucide-react';
import '../styles/Dashboard.css';

// Mock data for admin dashboard
const mockAdminStats = {
  totalUsers: 1248,
  activeUsers: 892,
  totalTransactions: 5420,
  revenue: 2450000,
  systemUptime: 99.95,
  activeOrders: 156
};

const mockRecentActivity = [
  {
    id: 1,
    type: 'user',
    message: 'New seller registered: AlumaPro Industries',
    time: '5 minutes ago',
    status: 'success'
  },
  {
    id: 2,
    type: 'transaction',
    message: 'High-value transaction completed: $125,000',
    time: '12 minutes ago',
    status: 'success'
  },
  {
    id: 3,
    type: 'alert',
    message: 'System maintenance scheduled for tonight',
    time: '1 hour ago',
    status: 'warning'
  },
  {
    id: 4,
    type: 'user',
    message: 'User verification completed: Premium Metals Ltd.',
    time: '2 hours ago',
    status: 'success'
  },
  {
    id: 5,
    type: 'system',
    message: 'Database backup completed successfully',
    time: '3 hours ago',
    status: 'success'
  }
];

const mockSystemMetrics = [
  { name: 'API Response Time', value: '45ms', status: 'excellent', icon: Activity },
  { name: 'Database Health', value: '98%', status: 'good', icon: Database },
  { name: 'Server Load', value: '34%', status: 'excellent', icon: Server },
  { name: 'Active Sessions', value: '2,341', status: 'good', icon: Globe }
];

const AdminDashboard = () => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'user':
        return <Users size={20} />;
      case 'transaction':
        return <DollarSign size={20} />;
      case 'alert':
        return <AlertCircle size={20} />;
      case 'system':
        return <Server size={20} />;
      default:
        return <Activity size={20} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'success':
        return 'status-delivered';
      case 'warning':
        return 'status-processing';
      case 'error':
        return 'status-pending';
      default:
        return 'status-transit';
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="dashboard-subtitle">System overview and management</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
            <Users size={24} color="#1976d2" />
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-value">{mockAdminStats.totalUsers}</p>
            <span className="stat-change positive">
              <TrendingUp size={16} />
              +18% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
            <Activity size={24} color="#388e3c" />
          </div>
          <div className="stat-content">
            <h3>Active Users</h3>
            <p className="stat-value">{mockAdminStats.activeUsers}</p>
            <span className="stat-label">Currently online</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
            <ShoppingBag size={24} color="#f57c00" />
          </div>
          <div className="stat-content">
            <h3>Transactions</h3>
            <p className="stat-value">{mockAdminStats.totalTransactions}</p>
            <span className="stat-change positive">
              <TrendingUp size={16} />
              +25% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f3e5f5' }}>
            <DollarSign size={24} color="#7b1fa2" />
          </div>
          <div className="stat-content">
            <h3>Revenue</h3>
            <p className="stat-value">${(mockAdminStats.revenue / 1000000).toFixed(2)}M</p>
            <span className="stat-change positive">
              <TrendingUp size={16} />
              +32% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e0f2f1' }}>
            <Shield size={24} color="#00796b" />
          </div>
          <div className="stat-content">
            <h3>System Uptime</h3>
            <p className="stat-value">{mockAdminStats.systemUptime}%</p>
            <span className="stat-label">Last 30 days</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fce4ec' }}>
            <Clock size={24} color="#c2185b" />
          </div>
          <div className="stat-content">
            <h3>Active Orders</h3>
            <p className="stat-value">{mockAdminStats.activeOrders}</p>
            <span className="stat-label">Pending processing</span>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>System Metrics</h2>
        </div>
        <div className="stats-grid">
          {mockSystemMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'rgba(0, 255, 255, 0.1)' }}>
                  <Icon size={24} style={{ color: 'var(--neon-cyan)' }} />
                </div>
                <div className="stat-content">
                  <h3>{metric.name}</h3>
                  <p className="stat-value">{metric.value}</p>
                  <span className={`status-badge ${metric.status === 'excellent' ? 'status-delivered' : 'status-transit'}`}>
                    {metric.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
        </div>
        <div className="activity-list">
          {mockRecentActivity.map((activity) => (
            <div key={activity.id} className="activity-item card">
              <div className="activity-icon">
                {getActivityIcon(activity.type)}
              </div>
              <div className="activity-content">
                <p className="activity-message">{activity.message}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
              <span className={`status-badge ${getStatusClass(activity.status)}`}>
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Admin Actions</h2>
        <div className="action-buttons">
          <a href="#manage-users" className="action-button">
            <Users size={20} />
            Manage Users
          </a>
          <a href="#view-reports" className="action-button">
            <Activity size={20} />
            View Reports
          </a>
          <a href="#system-settings" className="action-button">
            <Server size={20} />
            System Settings
          </a>
          <a href="#security" className="action-button">
            <Shield size={20} />
            Security Center
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
