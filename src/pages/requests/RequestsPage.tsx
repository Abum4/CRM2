import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check,
  X,
  UserPlus,
  Building2,
  Handshake,
  Clock,
} from 'lucide-react';

interface RequestItem {
  id: string;
  type: 'join' | 'register' | 'partner';
  userName: string;
  companyName: string;
  createdAt: string;
  note?: string;
}

export default function RequestsPage() {
  const { t } = useTranslation();

  // Mock data
  const requests: RequestItem[] = [
    { id: '1', type: 'join', userName: 'Новиков Андрей', companyName: 'ООО "Декларант"', createdAt: '29.01.2026', note: 'Хочу присоединиться к вашей команде' },
    { id: '2', type: 'partner', userName: 'ООО "Новый партнёр"', companyName: 'ООО "Новый партнёр"', createdAt: '28.01.2026', note: 'Предлагаем сотрудничество' },
    { id: '3', type: 'join', userName: 'Кузнецова Елена', companyName: 'ООО "Декларант"', createdAt: '27.01.2026' },
  ];

  const getTypeIcon = (type: RequestItem['type']) => {
    switch (type) {
      case 'join': return UserPlus;
      case 'register': return Building2;
      case 'partner': return Handshake;
    }
  };

  const getTypeLabel = (type: RequestItem['type']) => {
    switch (type) {
      case 'join': return t('requests.joinRequest');
      case 'register': return t('requests.registerRequest');
      case 'partner': return t('requests.partnerRequest');
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

  const joinRequests = requests.filter(r => r.type === 'join');
  const partnerRequests = requests.filter(r => r.type === 'partner');

  const RequestCard = ({ request }: { request: RequestItem }) => {
    const Icon = getTypeIcon(request.type);
    
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {request.type === 'partner' ? (
                  <Handshake className="h-5 w-5" />
                ) : (
                  getInitials(request.userName)
                )}
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
              <p className="text-sm text-muted-foreground mt-1">
                {request.companyName}
              </p>
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
          <TabsTrigger value="join">
            <UserPlus className="h-4 w-4 mr-2" />
            Вступление ({joinRequests.length})
          </TabsTrigger>
          <TabsTrigger value="partner">
            <Handshake className="h-4 w-4 mr-2" />
            Сотрудничество ({partnerRequests.length})
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

        <TabsContent value="join" className="mt-6">
          {joinRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">{t('requests.noRequests')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {joinRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="partner" className="mt-6">
          {partnerRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">{t('requests.noRequests')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {partnerRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
