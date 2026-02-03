import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2,
  Users,
  TrendingUp,
  Inbox,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  trend?: number;
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-success">+{trend}%</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RequestItem {
  id: string;
  type: 'company' | 'user' | 'partner';
  title: string;
  description: string;
  date: string;
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();

  // Mock data
  const stats = {
    totalCompanies: 156,
    totalUsers: 892,
    activeRequests: 12,
  };

  const growthData = [
    { month: 'Авг', companies: 120, users: 650 },
    { month: 'Сен', companies: 128, users: 720 },
    { month: 'Окт', companies: 138, users: 780 },
    { month: 'Ноя', companies: 145, users: 830 },
    { month: 'Дек', companies: 150, users: 860 },
    { month: 'Янв', companies: 156, users: 892 },
  ];

  const recentRequests: RequestItem[] = [
    {
      id: '1',
      type: 'company',
      title: 'ООО "Новая Фирма"',
      description: 'Запрос на регистрацию новой компании',
      date: '29.01.2026',
    },
    {
      id: '2',
      type: 'user',
      title: 'Иванов Иван',
      description: 'Хочет войти в ООО "Рога и Копыта"',
      date: '29.01.2026',
    },
    {
      id: '3',
      type: 'partner',
      title: 'ООО "Партнер"',
      description: 'Запрос на сотрудничество',
      date: '28.01.2026',
    },
  ];

  const getTypeIcon = (type: RequestItem['type']) => {
    switch (type) {
      case 'company':
        return Building2;
      case 'user':
        return Users;
      case 'partner':
        return Building2;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('menu.dashboard')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('dashboard.totalCompanies')}
          value={stats.totalCompanies}
          icon={Building2}
          trend={4}
        />
        <StatCard
          title={t('dashboard.totalUsers')}
          value={stats.totalUsers}
          icon={Users}
          trend={7}
        />
        <StatCard
          title={t('admin.activeRequests')}
          value={stats.activeRequests}
          icon={Inbox}
        />
      </div>

      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.growthChart')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="companies"
                  name="Компании"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="Пользователи"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--success))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Active Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            {t('admin.activeRequests')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {recentRequests.map((request) => {
                const Icon = getTypeIcon(request.type);
                return (
                  <div
                    key={request.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{request.title}</p>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {request.date}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
