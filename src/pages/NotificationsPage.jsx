import { useState } from 'react';
import { Bell, Check, Trash2, Filter, Package, ShoppingBag, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    type: 'order',
    title: 'Order Delivered',
    message: 'Your order ORD-001 has been delivered successfully',
    time: '2 hours ago',
    isRead: false,
    icon: Package
  },
  {
    id: 2,
    type: 'payment',
    title: 'Payment Confirmed',
    message: 'Payment for invoice INV-002 has been confirmed',
    time: '5 hours ago',
    isRead: false,
    icon: FileText
  },
  {
    id: 3,
    type: 'order',
    title: 'Order Shipped',
    message: 'Your order ORD-002 is now in transit',
    time: '1 day ago',
    isRead: true,
    icon: ShoppingBag
  },
  {
    id: 4,
    type: 'alert',
    title: 'Low Stock Alert',
    message: 'Aluminum Sheet 6061-T6 is running low on stock',
    time: '1 day ago',
    isRead: true,
    icon: AlertCircle
  },
  {
    id: 5,
    type: 'order',
    title: 'New Order Received',
    message: 'You received a new order from TechCorp Industries',
    time: '2 days ago',
    isRead: true,
    icon: ShoppingBag
  },
  {
    id: 6,
    type: 'payment',
    title: 'Invoice Generated',
    message: 'Invoice INV-005 has been generated and sent to customer',
    time: '3 days ago',
    isRead: true,
    icon: FileText
  }
];

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState('all');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'all') return true;
    return notification.type === filter;
  });

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const handleDelete = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success('Notification deleted');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
      toast.success('All notifications cleared');
    }
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case 'order':
        return 'notification-order';
      case 'payment':
        return 'notification-payment';
      case 'alert':
        return 'notification-alert';
      default:
        return '';
    }
  };

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div>
          <h1>
            <Bell size={32} />
            Notifications
          </h1>
          <p>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button 
              className="btn btn-secondary"
              onClick={handleMarkAllAsRead}
            >
              <Check size={18} />
              Mark All as Read
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              className="btn btn-danger"
              onClick={handleClearAll}
            >
              <Trash2 size={18} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button 
          className={`filter-tab ${filter === 'order' ? 'active' : ''}`}
          onClick={() => setFilter('order')}
        >
          Orders
        </button>
        <button 
          className={`filter-tab ${filter === 'payment' ? 'active' : ''}`}
          onClick={() => setFilter('payment')}
        >
          Payments
        </button>
        <button 
          className={`filter-tab ${filter === 'alert' ? 'active' : ''}`}
          onClick={() => setFilter('alert')}
        >
          Alerts
        </button>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.map((notification) => {
          const IconComponent = notification.icon;
          return (
            <div 
              key={notification.id} 
              className={`notification-item ${!notification.isRead ? 'unread' : ''} ${getNotificationClass(notification.type)}`}
            >
              <div className="notification-icon">
                <IconComponent size={24} />
              </div>
              
              <div className="notification-content">
                <div className="notification-header">
                  <h3>{notification.title}</h3>
                  <span className="notification-time">{notification.time}</span>
                </div>
                <p>{notification.message}</p>
              </div>

              <div className="notification-actions">
                {!notification.isRead && (
                  <button 
                    className="btn-icon"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Mark as read"
                  >
                    <Check size={18} />
                  </button>
                )}
                <button 
                  className="btn-icon btn-danger"
                  onClick={() => handleDelete(notification.id)}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {!notification.isRead && <div className="unread-indicator"></div>}
            </div>
          );
        })}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="empty-state">
          <Bell size={48} />
          <h3>No notifications</h3>
          <p>
            {filter === 'unread' 
              ? "You're all caught up!"
              : "You don't have any notifications yet"}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
