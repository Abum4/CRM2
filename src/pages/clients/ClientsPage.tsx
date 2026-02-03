import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Building2,
  User,
  FileText,
  Award,
  CheckSquare,
  FolderOpen,
  Lock,
  Globe,
  Users,
} from 'lucide-react';
import type { AccessType } from '@/types';

interface ClientItem {
  id: string;
  companyName: string;
  inn: string;
  directorName: string;
  accessType: AccessType;
  declarationsCount: number;
  certificatesCount: number;
  documentsCount: number;
  tasksCount: number;
}

export default function ClientsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [inn, setInn] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [accessType, setAccessType] = useState<AccessType>('public');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [note, setNote] = useState('');

  // Mock data
  const clients: ClientItem[] = [
    { id: '1', companyName: 'ООО "Клиент"', inn: '123456789', directorName: 'Иванов Иван', accessType: 'public', declarationsCount: 15, certificatesCount: 8, documentsCount: 12, tasksCount: 3 },
    { id: '2', companyName: 'ИП Петров', inn: '987654321', directorName: 'Петров Пётр', accessType: 'private', declarationsCount: 5, certificatesCount: 2, documentsCount: 4, tasksCount: 1 },
    { id: '3', companyName: 'ООО "Торговля"', inn: '456789123', directorName: 'Сидорова Анна', accessType: 'selected', declarationsCount: 22, certificatesCount: 10, documentsCount: 18, tasksCount: 5 },
  ];

  const employees = [
    { id: '1', name: 'Иванов И.И.' },
    { id: '2', name: 'Петрова М.А.' },
    { id: '3', name: 'Сидоров А.В.' },
  ];

  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(empId) 
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const handleSubmit = () => {
    console.log({
      companyName,
      inn,
      directorName,
      accessType,
      selectedEmployees,
      note,
    });
    setIsAddDialogOpen(false);
    // Reset form
    setCompanyName('');
    setInn('');
    setDirectorName('');
    setAccessType('public');
    setSelectedEmployees([]);
    setNote('');
  };

  const getAccessIcon = (type: AccessType) => {
    switch (type) {
      case 'private': return Lock;
      case 'public': return Globe;
      case 'selected': return Users;
    }
  };

  const filteredClients = clients.filter((client) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        client.companyName.toLowerCase().includes(query) ||
        client.inn.includes(query) ||
        client.directorName.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('clients.title')}</h1>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('clients.add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('clients.add')}</DialogTitle>
              <DialogDescription>
                Добавьте нового клиента в систему
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('clients.companyName')} *</Label>
                <Input
                  placeholder='ООО "Название"'
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('clients.inn')} *</Label>
                <Input
                  placeholder="123456789"
                  value={inn}
                  onChange={(e) => setInn(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  maxLength={9}
                />
                <p className="text-xs text-muted-foreground">{inn.length}/9 цифр</p>
              </div>

              <div className="space-y-2">
                <Label>{t('clients.directorName')} *</Label>
                <Input
                  placeholder="Иванов Иван Иванович"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('documents.access.title')} *</Label>
                <RadioGroup value={accessType} onValueChange={(v) => setAccessType(v as AccessType)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="client-public" />
                    <Label htmlFor="client-public" className="cursor-pointer flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t('documents.access.public')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="client-private" />
                    <Label htmlFor="client-private" className="cursor-pointer flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {t('documents.access.private')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="selected" id="client-selected" />
                    <Label htmlFor="client-selected" className="cursor-pointer flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Выбранные сотрудники
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {accessType === 'selected' && (
                <div className="space-y-2">
                  <Label>{t('documents.access.selectEmployees')}</Label>
                  <div className="border rounded-lg p-3 space-y-2">
                    {employees.map((emp) => (
                      <div key={emp.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`client-emp-${emp.id}`}
                          checked={selectedEmployees.includes(emp.id)}
                          onCheckedChange={() => toggleEmployeeSelection(emp.id)}
                        />
                        <Label htmlFor={`client-emp-${emp.id}`} className="cursor-pointer">
                          {emp.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t('declarations.note')}</Label>
                <Textarea
                  placeholder="Примечание о клиенте"
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
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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

      {/* Client Details Dialog */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedClient.companyName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ИНН</p>
                  <p className="font-medium">{selectedClient.inn}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Директор</p>
                  <p className="font-medium">{selectedClient.directorName}</p>
                </div>
              </div>

              <Tabs defaultValue="declarations">
                <TabsList>
                  <TabsTrigger value="declarations" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Декларации ({selectedClient.declarationsCount})
                  </TabsTrigger>
                  <TabsTrigger value="certificates" className="gap-2">
                    <Award className="h-4 w-4" />
                    Сертификаты ({selectedClient.certificatesCount})
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Документы ({selectedClient.documentsCount})
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Задачи ({selectedClient.tasksCount})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="declarations" className="mt-4">
                  <p className="text-muted-foreground text-center py-8">
                    Здесь будут связанные декларации
                  </p>
                </TabsContent>
                <TabsContent value="certificates" className="mt-4">
                  <p className="text-muted-foreground text-center py-8">
                    Здесь будут связанные сертификаты
                  </p>
                </TabsContent>
                <TabsContent value="documents" className="mt-4">
                  <p className="text-muted-foreground text-center py-8">
                    Здесь будут связанные документы
                  </p>
                </TabsContent>
                <TabsContent value="tasks" className="mt-4">
                  <p className="text-muted-foreground text-center py-8">
                    Здесь будут связанные задачи
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const AccessIcon = getAccessIcon(client.accessType);
          return (
            <Card 
              key={client.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedClient(client)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{client.companyName}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>ИНН: {client.inn}</span>
                    <AccessIcon className="h-4 w-4 ml-auto" />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {client.directorName}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline" className="gap-1">
                      <FileText className="h-3 w-3" />
                      {client.declarationsCount}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Award className="h-3 w-3" />
                      {client.certificatesCount}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <FolderOpen className="h-3 w-3" />
                      {client.documentsCount}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <CheckSquare className="h-3 w-3" />
                      {client.tasksCount}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
