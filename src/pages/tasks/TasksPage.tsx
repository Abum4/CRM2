import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  CalendarIcon,
  AlertTriangle,
  ArrowUp,
  Minus,
  Clock,
  CheckCircle,
  Pause,
  XCircle,
  Snowflake,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { TaskPriority, TaskStatus } from '@/types';

const priorityConfig: Record<TaskPriority, { label: string; icon: React.ElementType; className: string }> = {
  urgent: { label: 'Срочный', icon: AlertTriangle, className: 'text-destructive bg-destructive/10' },
  high: { label: 'Высокий', icon: ArrowUp, className: 'text-warning bg-warning/10' },
  normal: { label: 'Обычный', icon: Minus, className: 'text-muted-foreground bg-muted' },
};

const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  new: { label: 'Новая', icon: Plus, variant: 'outline' },
  in_progress: { label: 'В работе', icon: Clock, variant: 'default' },
  waiting: { label: 'Ожидание', icon: Pause, variant: 'secondary' },
  on_review: { label: 'На проверке', icon: Eye, variant: 'secondary' },
  completed: { label: 'Завершена', icon: CheckCircle, variant: 'default' },
  cancelled: { label: 'Отменена', icon: XCircle, variant: 'destructive' },
  frozen: { label: 'Заморожена', icon: Snowflake, variant: 'outline' },
};

interface TaskItem {
  id: string;
  name: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  targetEmployeeName: string;
  createdByName: string;
  createdByCompanyName: string;
}

export default function TasksPage() {
  const { t } = useTranslation();
  const { isDirectorOrSenior, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOwner, setFilterOwner] = useState<'mine' | 'all' | string>('mine');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [taskName, setTaskName] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [status, setStatus] = useState<TaskStatus>('new');
  const [deadline, setDeadline] = useState<Date>();
  const [deadlineDays, setDeadlineDays] = useState('');

  const isDeclarant = user?.activityType === 'declarant';

  // Mock data
  const tasks: TaskItem[] = [
    { id: '1', name: 'Подготовить документы для клиента', priority: 'urgent', status: 'in_progress', deadline: '30.01.2026', targetEmployeeName: 'Иванов И.И.', createdByName: 'Петрова М.А.', createdByCompanyName: 'ООО "Декларант"' },
    { id: '2', name: 'Проверить сертификаты', priority: 'high', status: 'new', deadline: '01.02.2026', targetEmployeeName: 'Петрова М.А.', createdByName: 'Иванов И.И.', createdByCompanyName: 'ООО "Декларант"' },
    { id: '3', name: 'Отправить отчёт', priority: 'normal', status: 'completed', deadline: '28.01.2026', targetEmployeeName: 'Сидоров А.В.', createdByName: 'Иванов И.И.', createdByCompanyName: 'ООО "Декларант"' },
    { id: '4', name: 'Связаться с партнёром', priority: 'normal', status: 'waiting', deadline: '02.02.2026', targetEmployeeName: 'Иванов И.И.', createdByName: 'Сидоров А.В.', createdByCompanyName: 'ООО "Сертификация"' },
  ];

  const companies = [
    { id: 'own', name: 'ООО "Декларант"' },
    { id: '1', name: 'ООО "Сертификация"' },
    { id: '2', name: 'ИП Партнёров' },
  ];

  const employees = [
    { id: '1', name: 'Иванов И.И.' },
    { id: '2', name: 'Петрова М.А.' },
    { id: '3', name: 'Сидоров А.В.' },
  ];

  const handleSubmit = () => {
    console.log({
      selectedCompany,
      selectedEmployee,
      taskName,
      note,
      priority,
      status,
      deadline,
      deadlineDays,
    });
    setIsAddDialogOpen(false);
    // Reset form
    setSelectedCompany('');
    setSelectedEmployee('');
    setTaskName('');
    setNote('');
    setPriority('normal');
    setStatus('new');
    setDeadline(undefined);
    setDeadlineDays('');
  };

  const filteredTasks = tasks.filter((task) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!task.name.toLowerCase().includes(query)) return false;
    }
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('tasks.title')}</h1>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('tasks.add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('tasks.add')}</DialogTitle>
              <DialogDescription>
                Создайте новую задачу для себя или коллеги
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('tasks.selectCompany')} *</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('tasks.selectEmployee')} *</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('tasks.name')} *</Label>
                <Input
                  placeholder="Название задачи"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('declarations.note')}</Label>
                <Textarea
                  placeholder="Примечание"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('tasks.priority.title')} *</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('tasks.status.title')} *</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('tasks.deadline')} *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Дней"
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(e.target.value)}
                    className="w-24"
                  />
                  <span className="flex items-center text-muted-foreground">или</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'flex-1 justify-start text-left font-normal',
                          !deadline && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? format(deadline, 'dd.MM.yyyy') : 'Выбрать дату'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={setDeadline}
                        locale={ru}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit}>
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as TaskPriority | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('tasks.priority.title')}</SelectItem>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TaskStatus | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('tasks.status.title')}</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isDirectorOrSenior && (
              <Select value={filterOwner} onValueChange={setFilterOwner}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('tasks.allTasks')}</SelectItem>
                  <SelectItem value="mine">{t('tasks.myTasks')}</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tasks.name')}</TableHead>
                <TableHead>{t('tasks.priority.title')}</TableHead>
                <TableHead>{t('tasks.status.title')}</TableHead>
                <TableHead>{t('tasks.deadline')}</TableHead>
                <TableHead>Исполнитель</TableHead>
                <TableHead>{t('tasks.createdBy')}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const priorityCfg = priorityConfig[task.priority];
                const statusCfg = statusConfig[task.status];
                const PriorityIcon = priorityCfg.icon;
                const StatusIcon = statusCfg.icon;
                
                return (
                  <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{task.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('gap-1', priorityCfg.className)}>
                        <PriorityIcon className="h-3 w-3" />
                        {priorityCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.deadline}</TableCell>
                    <TableCell>{task.targetEmployeeName}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{task.createdByName}</p>
                        <p className="text-xs text-muted-foreground">{task.createdByCompanyName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
