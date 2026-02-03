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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Check,
  Clock,
  Ban,
  FileCheck,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CertificateStatus } from '@/types';

interface CertificateItem {
  id: string;
  type: string;
  number?: string;
  clientName: string;
  status: CertificateStatus;
  deadline: string;
  ownerName: string;
  companyName?: string;
}

const statusConfig: Record<CertificateStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  in_progress: { label: 'В процессе', variant: 'default', icon: Clock },
  awaiting_payment: { label: 'Ждём оплату', variant: 'outline', icon: CreditCard },
  on_review: { label: 'На проверке', variant: 'secondary', icon: FileCheck },
  completed: { label: 'Завершено', variant: 'default', icon: Check },
  rejected: { label: 'Отклонён', variant: 'destructive', icon: Ban },
};

export default function CertificatesPage() {
  const { t } = useTranslation();
  const { user, isDirectorOrSenior } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOwner, setFilterOwner] = useState<'mine' | 'all' | string>('all');
  const [filterStatus, setFilterStatus] = useState<CertificateStatus | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state
  const [selectedCompany, setSelectedCompany] = useState('');
  const [certType, setCertType] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [fillByCertifier, setFillByCertifier] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [note, setNote] = useState('');

  const isDeclarant = user?.activityType === 'declarant';

  // Mock data
  const certificates: CertificateItem[] = [
    { id: '1', type: 'СТ-1', number: '123456', clientName: 'ООО "Клиент"', status: 'in_progress', deadline: '05.02.2026', ownerName: 'Иванов И.И.' },
    { id: '2', type: 'СТ-2', clientName: 'ИП Петров', status: 'awaiting_payment', deadline: '03.02.2026', ownerName: 'Петрова М.А.', companyName: 'ООО "Сертификация"' },
    { id: '3', type: 'ТР ТС', number: '789012', clientName: 'ООО "Торговля"', status: 'completed', deadline: '01.02.2026', ownerName: 'Иванов И.И.' },
    { id: '4', type: 'ГОСТ Р', clientName: 'ИП Сидоров', status: 'on_review', deadline: '10.02.2026', ownerName: 'Сидоров А.В.' },
  ];

  const certifierCompanies = [
    { id: 'self', name: t('certificates.forSelf') },
    { id: '1', name: 'ООО "Сертификация"' },
    { id: '2', name: 'ИП Сертификатов' },
  ];

  const clients = [
    { id: '1', name: 'ООО "Клиент"' },
    { id: '2', name: 'ИП Петров' },
    { id: '3', name: 'ООО "Торговля"' },
  ];

  const employees = [
    { id: '1', name: 'Иванов И.И.' },
    { id: '2', name: 'Петрова М.А.' },
    { id: '3', name: 'Сидоров А.В.' },
  ];

  const handleSubmit = () => {
    console.log({
      selectedCompany,
      certType,
      deadlineDays,
      certNumber,
      fillByCertifier,
      selectedClient,
      note,
    });
    setIsAddDialogOpen(false);
  };

  const filteredCertificates = certificates.filter((c) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!c.type.toLowerCase().includes(query) && 
          !c.clientName.toLowerCase().includes(query) &&
          !(c.number?.toLowerCase().includes(query))) {
        return false;
      }
    }
    if (filterStatus !== 'all' && c.status !== filterStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('certificates.title')}</h1>
        
        {isDeclarant && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t('certificates.add')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t('certificates.add')}</DialogTitle>
                <DialogDescription>
                  Создайте заявку на сертификат
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t('certificates.selectCompany')} *</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {certifierCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('certificates.type')} *</Label>
                  <Input
                    placeholder="СТ-1, ГОСТ Р, ТР ТС..."
                    value={certType}
                    onChange={(e) => setCertType(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('certificates.deadline')} *</Label>
                  <Input
                    type="number"
                    placeholder="Количество дней"
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('certificates.number')}</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="123456"
                      value={certNumber}
                      onChange={(e) => setCertNumber(e.target.value)}
                      disabled={fillByCertifier}
                      className={cn(fillByCertifier && 'opacity-50')}
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="fillByCertifier"
                        checked={fillByCertifier}
                        onCheckedChange={(checked) => {
                          setFillByCertifier(!!checked);
                          if (checked) setCertNumber('');
                        }}
                      />
                      <Label htmlFor="fillByCertifier" className="text-sm cursor-pointer">
                        {t('certificates.fillByCertifier')}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('declarations.client')} *</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('declarations.note')}</Label>
                  <Textarea
                    placeholder={t('declarations.note')}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSubmit}>
                  {t('common.submit')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
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
            
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as CertificateStatus | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterOwner} onValueChange={setFilterOwner}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('certificates.allCertificates')}</SelectItem>
                <SelectItem value="mine">{t('certificates.myCertificates')}</SelectItem>
                {isDirectorOrSenior && employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('certificates.type')}</TableHead>
                <TableHead>{t('certificates.number')}</TableHead>
                <TableHead>{t('declarations.client')}</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>{t('certificates.deadline')}</TableHead>
                <TableHead>Владелец</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCertificates.map((cert) => {
                const status = statusConfig[cert.status];
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={cert.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{cert.type}</TableCell>
                    <TableCell>{cert.number || '—'}</TableCell>
                    <TableCell>{cert.clientName}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{cert.deadline}</TableCell>
                    <TableCell>
                      <div>
                        <p>{cert.ownerName}</p>
                        {cert.companyName && (
                          <p className="text-xs text-muted-foreground">{cert.companyName}</p>
                        )}
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
                          <DropdownMenuItem>
                            <Users className="h-4 w-4 mr-2" />
                            {t('declarations.redirect')}
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
