import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  MoreHorizontal,
  Trash2,
  Ban,
  Unlock,
  MessageSquare,
  Building2,
  Users,
} from 'lucide-react';

interface CompanyItem {
  id: string;
  name: string;
  inn: string;
  activityType: 'declarant' | 'certification';
  employeesCount: number;
  directorName?: string;
  isBlocked: boolean;
  createdAt: string;
}

export default function AdminCompaniesPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [message, setMessage] = useState('');

  // Mock data
  const companies: CompanyItem[] = [
    { id: '1', name: 'ООО "Декларант"', inn: '123456789', activityType: 'declarant', employeesCount: 5, directorName: 'Иванов И.И.', isBlocked: false, createdAt: '15.01.2026' },
    { id: '2', name: 'ООО "Сертификация"', inn: '987654321', activityType: 'certification', employeesCount: 3, directorName: 'Петров П.П.', isBlocked: false, createdAt: '10.01.2026' },
    { id: '3', name: 'ИП Партнёров', inn: '456789123', activityType: 'certification', employeesCount: 2, isBlocked: true, createdAt: '05.01.2026' },
    { id: '4', name: 'ООО "Новая фирма"', inn: '789123456', activityType: 'declarant', employeesCount: 1, isBlocked: false, createdAt: '28.01.2026' },
  ];

  const handleBlock = (company: CompanyItem) => {
    console.log('Block/unblock company:', company.id);
  };

  const handleDelete = (company: CompanyItem) => {
    console.log('Delete company:', company.id);
  };

  const handleSendMessage = () => {
    console.log('Send message to:', selectedCompany?.id, message);
    setIsMessageDialogOpen(false);
    setSelectedCompany(null);
    setMessage('');
  };

  const filteredCompanies = companies.filter((company) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        company.name.toLowerCase().includes(query) ||
        company.inn.includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('menu.companies')}</h1>

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.sendMessage')}</DialogTitle>
            <DialogDescription>
              Сообщение для {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label>Сообщение</Label>
            <Textarea
              className="mt-2"
              placeholder="Введите сообщение..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSendMessage}>
              {t('common.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('company.name')}</TableHead>
                <TableHead>{t('company.inn')}</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Директор</TableHead>
                <TableHead>Сотрудники</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id} className={company.isBlocked ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {company.name}
                    </div>
                  </TableCell>
                  <TableCell>{company.inn}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {company.activityType === 'declarant' ? t('auth.declarant') : t('auth.certification')}
                    </Badge>
                  </TableCell>
                  <TableCell>{company.directorName || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {company.employeesCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.isBlocked ? (
                      <Badge variant="destructive">Заблокирована</Badge>
                    ) : (
                      <Badge variant="default">Активна</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{company.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedCompany(company);
                          setIsMessageDialogOpen(true);
                        }}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {t('admin.sendMessage')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBlock(company)}>
                          {company.isBlocked ? (
                            <>
                              <Unlock className="h-4 w-4 mr-2" />
                              Разблокировать
                            </>
                          ) : (
                            <>
                              <Ban className="h-4 w-4 mr-2" />
                              Заблокировать
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(company)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
