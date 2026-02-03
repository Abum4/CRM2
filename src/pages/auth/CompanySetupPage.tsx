import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Building2, LogIn, UserPlus } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { api } from '@/api';

export default function CompanySetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { registerCompany, setCompany } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<'register' | 'join'>('register');
  const [companyName, setCompanyName] = useState('');
  const [inn, setInn] = useState('');
  const [foundCompanyName, setFoundCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleInnChange = async (value: string) => {
    // Allow only digits and limit to 9
    const digitsOnly = value.replace(/\D/g, '').slice(0, 9);
    setInn(digitsOnly);
    setFoundCompanyName('');

    if (tab === 'join' && digitsOnly.length === 9) {
      setIsSearching(true);
      try {
        const response = await api.companies.findByInn(digitsOnly);
        if (response.success && response.data) {
          setFoundCompanyName(response.data.name);
        } else {
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: t('company.notFound'),
          });
        }
      } catch (error) {
        console.error('Failed to find company:', error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inn.length !== 9) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('company.innDigits'),
      });
      return;
    }

    setIsLoading(true);
    try {
      await registerCompany(companyName, inn);
      toast({
        title: t('common.success'),
        description: t('company.pendingApproval'),
      });
      navigate('/pending-approval');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('company.alreadyExists'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inn.length !== 9) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('company.innDigits'),
      });
      return;
    }

    if (!foundCompanyName) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('company.notFound'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.companies.join(inn);
      if (response.success) {
        setCompany(response.data);
        toast({
          title: t('common.success'),
          description: t('company.pendingApproval'),
        });
        navigate('/pending-approval');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to join company',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{t('company.title')}</CardTitle>
          <CardDescription>{t('company.registerOrJoin')}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => { setTab(v as 'register' | 'join'); setInn(''); setFoundCompanyName(''); }}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t('company.register')}
              </TabsTrigger>
              <TabsTrigger value="join" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                {t('company.join')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">{t('company.name')}</Label>
                  <Input
                    id="companyName"
                    placeholder={t('company.name')}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inn">{t('company.inn')}</Label>
                  <Input
                    id="inn"
                    placeholder="123456789"
                    value={inn}
                    onChange={(e) => handleInnChange(e.target.value)}
                    required
                    maxLength={9}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('company.innDigits')} ({inn.length}/9)
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || inn.length !== 9}
                >
                  {isLoading ? t('common.loading') : t('company.register')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join">
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="joinInn">{t('company.inn')}</Label>
                  <Input
                    id="joinInn"
                    placeholder="123456789"
                    value={inn}
                    onChange={(e) => handleInnChange(e.target.value)}
                    required
                    maxLength={9}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('company.innDigits')} ({inn.length}/9)
                  </p>
                </div>

                {isSearching && (
                  <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                )}

                {foundCompanyName && (
                  <div className="space-y-2">
                    <Label htmlFor="foundCompany">{t('company.name')}</Label>
                    <Input
                      id="foundCompany"
                      value={foundCompanyName}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || inn.length !== 9 || !foundCompanyName}
                >
                  {isLoading ? t('common.loading') : t('company.join')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
