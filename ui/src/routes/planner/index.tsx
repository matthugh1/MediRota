import React from 'react';
import { 
  CalendarRange, 
  Users, 
  ActivitySquare, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Building2,
  FileText
} from 'lucide-react';
import { useWards, useSchedules } from '../../lib/hooks';
import { getCurrentWeekRange } from '../../lib/date';
import { Spinner, EmptyState } from '../../components';

const PlannerDashboard: React.FC = () => {
  // Get current week range
  const currentWeekRange = getCurrentWeekRange();
  
  // Fetch data using hooks
  const { data: wardsData, isLoading: wardsLoading, error: wardsError } = useWards();
  const { data: schedulesData, isLoading: schedulesLoading, error: schedulesError } = useSchedules('all');

  // Loading state
  if (wardsLoading || schedulesLoading) {
    return <Spinner size="lg" text="Loading dashboard..." />;
  }

  // Error state
  if (wardsError || schedulesError) {
    return (
      <div className="text-center">
        <p className="text-red-600">Failed to load dashboard data</p>
      </div>
    );
  }

  const stats = [
    {
      title: 'Active Schedules',
      value: '12',
      change: '+2',
      changeType: 'positive' as const,
      icon: CalendarRange,
      color: 'bg-indigo-500'
    },
    {
      title: 'Total Staff',
      value: '156',
      change: '+8',
      changeType: 'positive' as const,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'Coverage Rate',
      value: '94.2%',
      change: '+1.8%',
      changeType: 'positive' as const,
      icon: ActivitySquare,
      color: 'bg-purple-500'
    },
    {
      title: 'Unfilled Shifts',
      value: '23',
      change: '-5',
      changeType: 'negative' as const,
      icon: AlertTriangle,
      color: 'bg-red-500'
    }
  ];

  const quickActions = [
    {
      title: 'Create Schedule',
      description: 'Start a new rota schedule',
      icon: CalendarRange,
      href: '/planner/schedules',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    {
      title: 'Demand Builder',
      description: 'Configure staffing requirements',
      icon: FileText,
      href: '/planner/demand',
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      title: 'Manage Staff',
      description: 'Add or update staff members',
      icon: Users,
      href: '/planner/staff',
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      title: 'View Metrics',
      description: 'Analyze rota performance',
      icon: ActivitySquare,
      href: '/planner/metrics',
      color: 'bg-orange-50 text-orange-700 border-orange-200'
    }
  ];

  const recentActivity = [
    {
      action: 'Schedule solved',
      description: 'General Ward - January 2024',
      time: '2 minutes ago',
      status: 'success'
    },
    {
      action: 'Staff added',
      description: 'Dr. Sarah Johnson - Emergency',
      time: '15 minutes ago',
      status: 'info'
    },
    {
      action: 'Demand updated',
      description: 'ICU - Night shift requirements',
      time: '1 hour ago',
      status: 'warning'
    },
    {
      action: 'Schedule published',
      description: 'Surgical Ward - December 2023',
      time: '2 hours ago',
      status: 'success'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Planner Dashboard</h1>
        <p className="text-zinc-600">Welcome back! Here's what's happening with your rotas.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600">{stat.title}</p>
                <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-zinc-500 ml-1">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <a
              key={action.title}
              href={action.href}
              className="group block p-4 rounded-xl border-2 border-transparent hover:border-zinc-200 transition-colors"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} mb-3`}>
                <action.icon className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-zinc-900 group-hover:text-indigo-600 transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-zinc-600 mt-1">{action.description}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-zinc-50 transition-colors">
              <div className={`w-2 h-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-500' :
                activity.status === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">{activity.action}</p>
                <p className="text-sm text-zinc-600">{activity.description}</p>
              </div>
              <span className="text-sm text-zinc-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Solver Service</span>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Database</span>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Last Backup</span>
              <span className="text-sm text-zinc-900">2 hours ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Performance</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Average Solve Time</span>
              <span className="text-sm font-medium text-zinc-900">45s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Repair Success Rate</span>
              <span className="text-sm font-medium text-zinc-900">98.5%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Active Users</span>
              <span className="text-sm font-medium text-zinc-900">12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerDashboard;

