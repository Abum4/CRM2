import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Users,
  FolderPlus,
  FolderMinus,
  CalendarIcon,
  Filter,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DeclarationMode, VehicleType, Vehicle } from '@/types';

const DECLARATION_MODES: DeclarationMode[] = [
  'ЭК/10', 'ЭК/11', 'ЭК/12', 'ИМ/40', 'ИМ/41', 'ИМ/42', 'ИМ/51',
  'ЭК/51', 'ЭК/61', 'ИМ/61', 'ИМ/70', 'ИМ/71', 'ЭК/71', 'ИМ/72',
  'ЭК/72', 'ИМ/73', 'ЭК/73', 'ИМ/74', 'ЭК/74', 'ИМ/75', 'ЭК/75',
  'ИМ/76', 'ТР/80', 'НД/40', 'ПР/40', 'ПЕ/40', 'ВД/40', 'ВД/10', 'ВД/74',
];

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: '10', label: '10/МОРСКОЙ' },
  { value: '20', label: '20/ЖД' },
  { value: '30', label: '30/АВТО' },
  { value: '40', label: '40/АВИА' },
  { value: '71', label: '71/ТРУБОПРОВОД' },
  { value: '72', label: '72/ЛЭП' },
  { value: '80', label: '80/РЕЧНОЙ' },
  { value: '90', label: '90/САМОХОД' },
];

interface DeclarationItem {
  id: string;
  formattedNumber: string;
  clientName: string;
  mode: DeclarationMode;
  date: string;
  ownerName: string;
  groupName?: string;
}

export default function DeclarationsPage() {
  const { t } = useTranslation();
  const { isDirectorOrSenior } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOwner, setFilterOwner] = useState<'mine' | 'all' | string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Form state
  const [postNumber, setPostNumber] = useState('');
  const [date, setDate] = useState<Date>();
  const [declarationNumber, setDeclarationNumber] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedMode, setSelectedMode] = useState<DeclarationMode | ''>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([{ number: '', type: '30' }]);
  const [note, setNote] = useState('');

  // Mock data
  const declarations: DeclarationItem[] = [
    { id: '1', formattedNumber: '26001/29.01.2026/0010722', clientName: 'ООО "Клиент"', mode: 'ИМ/40', date: '29.01.2026', ownerName: 'Иванов И.И.' },
    { id: '2', formattedNumber: '26001/28.01.2026/0010721', clientName: 'ИП Петров', mode: 'ЭК/10', date: '28.01.2026', ownerName: 'Петрова М.А.', groupName: 'Группа 1' },
    { id: '3', formattedNumber: '26001/27.01.2026/0010720', clientName: 'ООО "Торговля"', mode: 'ИМ/42', date: '27.01.2026', ownerName: 'Иванов И.И.' },
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

  const addVehicle = () => {
    setVehicles([...vehicles, { number: '', type: '30' }]);
  };

  const removeVehicle = (index: number) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter((_, i) => i !== index));
    }
  };

  const updateVehicle = (index: number, field: 'number' | 'type', value: string) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: value };
    setVehicles(updated);
  };

  const handleSubmit = () => {
    // TODO: API call
    console.log({
      postNumber,
      date,
      declarationNumber,
      selectedClient,
      selectedMode,
      vehicles,
      note,
    });
    setIsAddDialogOpen(false);
    // Reset form
    setPostNumber('');
    setDate(undefined);
    setDeclarationNumber('');
    setSelectedClient('');
    setSelectedMode('');
    setVehicles([{ number: '', type: '30' }]);
    setNote('');
  };

  const filteredDeclarations = declarations.filter((d) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        d.formattedNumber.toLowerCase().includes(query) ||
        d.clientName.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('declarations.title')}</h1>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('declarations.add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('declarations.add')}</DialogTitle>
              <DialogDescription>
                Заполните все обязательные поля для добавления декларации
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Declaration Number */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('declarations.postNumber')} *</Label>
                  <Input
                    placeholder="26001"
                    value={postNumber}
                    onChange={(e) => setPostNumber(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    maxLength={5}
                  />
                  <p className="text-xs text-muted-foreground">{postNumber.length}/5</p>
                </div>
                
                <div className="space-y-2">
                  <Label>{t('declarations.date')} *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'dd.MM.yyyy') : 'Выберите дату'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        locale={ru}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>{t('declarations.declarationNumber')} *</Label>
                  <Input
                    placeholder="0010722"
                    value={declarationNumber}
                    onChange={(e) => setDeclarationNumber(e.target.value.replace(/\D/g, '').slice(0, 7))}
                    maxLength={7}
                  />
                  <p className="text-xs text-muted-foreground">{declarationNumber.length}/7</p>
                </div>
              </div>

              {/* Client */}
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

              {/* Mode */}
              <div className="space-y-2">
                <Label>{t('declarations.mode')} *</Label>
                <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as DeclarationMode)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {DECLARATION_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('declarations.vehicleNumber')} *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addVehicle}>
                    <Plus className="h-4 w-4 mr-1" />
                    Добавить
                  </Button>
                </div>
                {vehicles.map((vehicle, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="01A123BC"
                      value={vehicle.number}
                      onChange={(e) => updateVehicle(index, 'number', e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Select
                      value={vehicle.type}
                      onValueChange={(v) => updateVehicle(index, 'type', v)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {vehicles.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVehicle(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Note */}
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
            
            <Select value={filterOwner} onValueChange={setFilterOwner}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('declarations.allDeclarations')}</SelectItem>
                <SelectItem value="mine">{t('declarations.myDeclarations')}</SelectItem>
                {isDirectorOrSenior && employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              {t('common.filter')}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>{t('declarations.mode')}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {DECLARATION_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('declarations.client')}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('declarations.vehicleType')}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {VEHICLE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер декларации</TableHead>
                <TableHead>{t('declarations.client')}</TableHead>
                <TableHead>{t('declarations.mode')}</TableHead>
                <TableHead>{t('declarations.date')}</TableHead>
                <TableHead>Владелец</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeclarations.map((declaration) => (
                <TableRow key={declaration.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {declaration.formattedNumber}
                      {declaration.groupName && (
                        <Badge variant="outline">{declaration.groupName}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{declaration.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{declaration.mode}</Badge>
                  </TableCell>
                  <TableCell>{declaration.date}</TableCell>
                  <TableCell>{declaration.ownerName}</TableCell>
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
                          <FolderPlus className="h-4 w-4 mr-2" />
                          {t('declarations.addToGroup')}
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
