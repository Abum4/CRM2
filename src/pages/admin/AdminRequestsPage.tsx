import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check,
  X,
  UserPlus,
  Building2,
  Clock,
  Crown,
} from 'lucide-react';

interface RequestItem {
  id: string;
  type: 'company' | 'user' | 'director';
  userName: string;
  companyName: string;
  activityType: 'declarant' | 'certification';
  createdAt: string;
  note?: string;
}

export default function AdminRequestsPage() {
  const { t } = useTranslation();

  // Mock data
  const requests: RequestItem[] = [
    { id: '1', type: 'company', userName: 'Новиков Андрей', companyName: 'ООО "Новая фирма"', activityType: 'declarant', createdAt: '29.01.2026', note: 'Хотим зарегистрировать компанию' },
    { id: '2', type: 'user', userName: 'Кузнецова Елена', companyName: 'ООО "Декларант"', activityType: 'declarant', createdAt: '28.01.2026' },
    { id: '3', type: 'company', userName: 'Смирнов Дмитрий', companyName: 'ИП Смирнов', activityType: 'certification', createdAt: '27.01.2026' },
  ];

  const getTypeIcon = (type: RequestItem['type']) => {
    switch (type) {
      case 'company': return Building2;
      case 'user': return UserPlus;
      case 'director': return Crown;
    }
  };

  const getTypeLabel = (type: RequestItem['type']) => {
    switch (type) {
      case 'company': return 'Регистрация компании';
      case 'user': return 'Вступление в компанию';
      case 'director': return 'Назначение директора';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAccept = (id: string) => {
    console.log('Accept request:', id);
  };

  const handleReject = (id: string) => {
    console.log('Reject request:', id);
  };

  const companyRequests = requests.filter(r => r.type === 'company');
  const userRequests = requests.filter(r => r.type === 'user');

  const RequestCard = ({ request }: { request: RequestItem }) => {
    const Icon = getTypeIcon(request.type);
    
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-destructive/10 text-destructive">
                <Icon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium">{request.userName}</p>
                <Badge variant="outline" className="gap-1">
                  <Icon className="h-3 w-3" />
                  {getTypeLabel(request.type)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{request.companyName}</p>
                <Badge variant="secondary" className="text-xs">
                  {request.activityType === 'declarant' ? t('auth.declarant') : t('auth.certification')}
                </Badge>
              </div>
              {request.note && (
                <p className="text-sm mt-2 p-2 bg-muted rounded-md">
                  {request.note}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {request.createdAt}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-success hover:bg-success/10 hover:text-success"
                onClick={() => handleAccept(request.id)}
              >
                <Check className="h-4 w-4 mr-1" />
                {t('requests.accept')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleReject(request.id)}
              >
                <X className="h-4 w-4 mr-1" />
                {t('requests.reject')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('requests.title')}</h1>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            Все ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="h-4 w-4 mr-2" />
            Компании ({companyRequests.length})
          </TabsTrigger>
          <TabsTrigger value="user">
            <UserPlus className="h-4 w-4 mr-2" />
            Пользователи ({userRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">{t('requests.noRequests')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="company" className="mt-6">
          {companyRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">{t('requests.noRequests')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {companyRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="user" className="mt-6">
          {userRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">{t('requests.noRequests')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
