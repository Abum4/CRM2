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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Building2,
  Check,
  X,
  Clock,
  Handshake,
} from 'lucide-react';

interface PartnerCompany {
  id: string;
  name: string;
  inn: string;
  activityType: 'declarant' | 'certification';
  status: 'active' | 'pending' | 'rejected';
  employeesCount: number;
}

export default function PartnersPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state
  const [searchInn, setSearchInn] = useState('');
  const [foundCompany, setFoundCompany] = useState<{ name: string } | null>(null);
  const [note, setNote] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Mock data
  const partners: PartnerCompany[] = [
    { id: '1', name: 'ООО "Сертификация"', inn: '111222333', activityType: 'certification', status: 'active', employeesCount: 5 },
    { id: '2', name: 'ИП Партнёров', inn: '444555666', activityType: 'certification', status: 'active', employeesCount: 2 },
    { id: '3', name: 'ООО "Новый партнёр"', inn: '777888999', activityType: 'declarant', status: 'pending', employeesCount: 3 },
  ];

  const handleInnSearch = async (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 9);
    setSearchInn(digitsOnly);
    setFoundCompany(null);

    if (digitsOnly.length === 9) {
      setIsSearching(true);
      // Simulate API call
      setTimeout(() => {
        setFoundCompany({ name: 'ООО "Найденная компания"' });
        setIsSearching(false);
      }, 500);
    }
  };

  const handleSubmit = () => {
    console.log({
      searchInn,
      foundCompany,
      note,
    });
    setIsAddDialogOpen(false);
    setSearchInn('');
    setFoundCompany(null);
    setNote('');
  };

  const getStatusBadge = (status: PartnerCompany['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="gap-1"><Check className="h-3 w-3" />Партнёр</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Ожидание</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />Отклонено</Badge>;
    }
  };

  const filteredPartners = partners.filter((partner) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        partner.name.toLowerCase().includes(query) ||
        partner.inn.includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('partners.title')}</h1>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('partners.sendRequest')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('partners.sendRequest')}</DialogTitle>
              <DialogDescription>
                Введите ИНН компании для отправки запроса на сотрудничество
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('company.inn')} *</Label>
                <Input
                  placeholder="123456789"
                  value={searchInn}
                  onChange={(e) => handleInnSearch(e.target.value)}
                  maxLength={9}
                />
                <p className="text-xs text-muted-foreground">{searchInn.length}/9 цифр</p>
              </div>

              {isSearching && (
                <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
              )}

              {foundCompany && (
                <div className="space-y-2">
                  <Label>{t('company.name')}</Label>
                  <Input value={foundCompany.name} disabled className="bg-muted" />
                </div>
              )}

              <div className="space-y-2">
                <Label>{t('declarations.note')}</Label>
                <Textarea
                  placeholder="Сообщение для запроса"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={!foundCompany}>
                {t('common.submit')}
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
              placeholder={t('partners.searchByInn')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPartners.map((partner) => (
          <Card key={partner.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{partner.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить партнёрство
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ИНН: {partner.inn}</span>
                  {getStatusBadge(partner.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {partner.activityType === 'declarant' ? t('auth.declarant') : t('auth.certification')}
                </div>
                <p className="text-sm text-muted-foreground">
                  {partner.employeesCount} сотрудников
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
