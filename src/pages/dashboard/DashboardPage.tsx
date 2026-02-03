import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  CheckSquare,
  CheckCircle,
  AlertTriangle,
  FileText,
  Award,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  trend?: number;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className={cn('h-4 w-4', trend >= 0 ? 'text-success' : 'text-destructive')} />
                <span className={trend >= 0 ? 'text-success' : 'text-destructive'}>
                  {trend >= 0 ? '+' : ''}{trend}%
                </span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', variantStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  status?: string;
}

function RecentList({ title, items }: { title: string; items: RecentItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Нет данных</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="space-y-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                  {item.status && (
                    <Badge variant="outline" className="mt-1">
                      {item.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, isDirectorOrSenior } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const isDeclarant = user?.activityType === 'declarant';

  // Mock data - will be replaced with API calls
  const stats = {
    activeTasks: 12,
    completedTasks: 45,
    overdueTasks: 3,
    sentDeclarations: 28,
    activeCertificates: 8,
    completedCertificates: 34,
    overdueCertificates: 2,
  };

  const recentDeclarations: RecentItem[] = [
    { id: '1', title: '26001/29.01.2026/0010722', subtitle: 'ООО "Клиент"', date: '29.01.2026', status: 'ИМ/40' },
    { id: '2', title: '26001/28.01.2026/0010721', subtitle: 'ИП Иванов', date: '28.01.2026', status: 'ЭК/10' },
    { id: '3', title: '26001/27.01.2026/0010720', subtitle: 'ООО "Торговля"', date: '27.01.2026', status: 'ИМ/42' },
  ];

  const recentCertificates: RecentItem[] = [
    { id: '1', title: 'СТ-1 №123456', subtitle: 'ООО "Клиент"', date: '29.01.2026', status: 'В процессе' },
    { id: '2', title: 'СТ-2 №123455', subtitle: 'ИП Иванов', date: '28.01.2026', status: 'Завершено' },
  ];

  const employees = [
    { id: 'all', name: t('dashboard.allEmployees') },
    { id: '1', name: 'Иванов Иван' },
    { id: '2', name: 'Петрова Мария' },
    { id: '3', name: 'Сидоров Алексей' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('menu.dashboard')}</h1>
        
        <div className="flex flex-wrap gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('dashboard.selectPeriod')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Неделя</SelectItem>
              <SelectItem value="month">Месяц</SelectItem>
              <SelectItem value="quarter">Квартал</SelectItem>
              <SelectItem value="year">Год</SelectItem>
            </SelectContent>
          </Select>

          {isDirectorOrSenior && (
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('dashboard.selectEmployee')} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.activeTasks')}
          value={stats.activeTasks}
          icon={CheckSquare}
          variant="default"
        />
        <StatCard
          title={t('dashboard.completedTasks')}
          value={stats.completedTasks}
          icon={CheckCircle}
          variant="success"
          trend={12}
        />
        <StatCard
          title={t('dashboard.overdueTasks')}
          value={stats.overdueTasks}
          icon={AlertTriangle}
          variant="destructive"
        />
        {isDeclarant && (
          <StatCard
            title={t('dashboard.sentDeclarations')}
            value={stats.sentDeclarations}
            icon={FileText}
            trend={8}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title={t('dashboard.activeCertificates')}
          value={stats.activeCertificates}
          icon={Award}
          variant="default"
        />
        <StatCard
          title={t('dashboard.completedCertificates')}
          value={stats.completedCertificates}
          icon={CheckCircle}
          variant="success"
          trend={5}
        />
        <StatCard
          title={t('dashboard.overdueCertificates')}
          value={stats.overdueCertificates}
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Recent Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isDeclarant && (
          <RecentList
            title={t('dashboard.recentDeclarations')}
            items={recentDeclarations}
          />
        )}
        <RecentList
          title={t('dashboard.recentCertificates')}
          items={recentCertificates}
        />
      </div>
    </div>
  );
}
