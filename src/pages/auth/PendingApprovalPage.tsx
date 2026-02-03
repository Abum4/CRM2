import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function PendingApprovalPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-warning/20 flex items-center justify-center">
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{t('company.pendingApproval')}</CardTitle>
          <CardDescription className="text-base">
            Ваш запрос был отправлен. Ожидайте подтверждения от администратора или директора фирмы.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Вы получите уведомление, когда ваш запрос будет рассмотрен.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
