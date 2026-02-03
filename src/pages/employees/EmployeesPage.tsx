import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Trash2,
  Ban,
  Unlock,
  User,
  Phone,
  Mail,
  Building2,
  Users,
  AlertTriangle,
} from 'lucide-react';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'director' | 'senior' | 'employee';
  avatarUrl?: string;
  isBlocked: boolean;
  companyName: string;
  isPartner: boolean;
}

export default function EmployeesPage() {
  const { t } = useTranslation();
  const { isDirectorOrSenior } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [reassignTo, setReassignTo] = useState('');

  // Mock data
  const myColleagues: Employee[] = [
    { id: '1', fullName: 'Иванов Иван Иванович', email: 'ivanov@company.com', phone: '+998 90 123 45 67', role: 'director', isBlocked: false, companyName: 'ООО "Декларант"', isPartner: false },
    { id: '2', fullName: 'Петрова Мария Александровна', email: 'petrova@company.com', phone: '+998 90 234 56 78', role: 'senior', isBlocked: false, companyName: 'ООО "Декларант"', isPartner: false },
    { id: '3', fullName: 'Сидоров Алексей Викторович', email: 'sidorov@company.com', phone: '+998 90 345 67 89', role: 'employee', isBlocked: false, companyName: 'ООО "Декларант"', isPartner: false },
    { id: '4', fullName: 'Козлова Елена Сергеевна', email: 'kozlova@company.com', phone: '+998 90 456 78 90', role: 'employee', isBlocked: true, companyName: 'ООО "Декларант"', isPartner: false },
  ];

  const partnerColleagues: Employee[] = [
    { id: '5', fullName: 'Смирнов Дмитрий', email: 'smirnov@cert.com', phone: '+998 90 567 89 01', role: 'director', isBlocked: false, companyName: 'ООО "Сертификация"', isPartner: true },
    { id: '6', fullName: 'Новикова Анна', email: 'novikova@cert.com', phone: '+998 90 678 90 12', role: 'employee', isBlocked: false, companyName: 'ООО "Сертификация"', isPartner: true },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role: Employee['role']) => {
    switch (role) {
      case 'director':
        return <Badge variant="default">{t('roles.director')}</Badge>;
      case 'senior':
        return <Badge variant="secondary">{t('roles.senior')}</Badge>;
      default:
        return <Badge variant="outline">{t('roles.employee')}</Badge>;
    }
  };

  const handleRemove = () => {
    console.log('Remove employee:', selectedEmployee?.id, 'reassign to:', reassignTo);
    setIsRemoveDialogOpen(false);
    setSelectedEmployee(null);
    setReassignTo('');
  };

  const handleBlock = (employee: Employee) => {
    console.log('Block/unblock employee:', employee.id);
  };

  const EmployeeCard = ({ employee }: { employee: Employee }) => (
    <Card className={employee.isBlocked ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={employee.avatarUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(employee.fullName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{employee.fullName}</p>
              {employee.isBlocked && (
                <Badge variant="destructive" className="gap-1">
                  <Ban className="h-3 w-3" />
                  {t('employees.blocked')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getRoleBadge(employee.role)}
            </div>
            <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {employee.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {employee.phone}
              </div>
            </div>
          </div>

          {isDirectorOrSenior && !employee.isPartner && employee.role !== 'director' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBlock(employee)}>
                  {employee.isBlocked ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      {t('employees.unblock')}
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      {t('employees.block')}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setIsRemoveDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('employees.remove')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('employees.title')}</h1>

      {/* Remove Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('employees.remove')}
            </DialogTitle>
            <DialogDescription>
              {t('employees.reassignData')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label>Выберите сотрудника для передачи данных *</Label>
            <Select value={reassignTo} onValueChange={setReassignTo}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                {myColleagues
                  .filter(e => e.id !== selectedEmployee?.id && !e.isBlocked)
                  .map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={!reassignTo}>
              {t('employees.remove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* My Colleagues */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('employees.myColleagues')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myColleagues.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      </div>

      {/* Partner Colleagues */}
      {partnerColleagues.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('employees.partnerColleagues')}</h2>
          </div>
          
          {/* Group by company */}
          {Array.from(new Set(partnerColleagues.map(e => e.companyName))).map((companyName) => (
            <div key={companyName} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">{companyName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partnerColleagues
                  .filter(e => e.companyName === companyName)
                  .map((employee) => (
                    <EmployeeCard key={employee.id} employee={employee} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
