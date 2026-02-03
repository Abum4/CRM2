import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Crown,
  Star,
  User,
  Building2,
  Phone,
  Mail,
} from 'lucide-react';

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'director' | 'senior' | 'employee';
  companyName?: string;
  activityType: 'declarant' | 'certification';
  isBlocked: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [message, setMessage] = useState('');

  // Mock data
  const users: UserItem[] = [
    { id: '1', fullName: 'Иванов Иван Иванович', email: 'ivanov@company.com', phone: '+998 90 123 45 67', role: 'director', companyName: 'ООО "Декларант"', activityType: 'declarant', isBlocked: false, createdAt: '15.01.2026' },
    { id: '2', fullName: 'Петрова Мария Александровна', email: 'petrova@company.com', phone: '+998 90 234 56 78', role: 'senior', companyName: 'ООО "Декларант"', activityType: 'declarant', isBlocked: false, createdAt: '16.01.2026' },
    { id: '3', fullName: 'Сидоров Алексей Викторович', email: 'sidorov@cert.com', phone: '+998 90 345 67 89', role: 'director', companyName: 'ООО "Сертификация"', activityType: 'certification', isBlocked: false, createdAt: '10.01.2026' },
    { id: '4', fullName: 'Козлова Елена Сергеевна', email: 'kozlova@company.com', phone: '+998 90 456 78 90', role: 'employee', companyName: 'ООО "Декларант"', activityType: 'declarant', isBlocked: true, createdAt: '20.01.2026' },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleIcon = (role: UserItem['role']) => {
    switch (role) {
      case 'director': return Crown;
      case 'senior': return Star;
      default: return User;
    }
  };

  const getRoleBadge = (role: UserItem['role']) => {
    const Icon = getRoleIcon(role);
    switch (role) {
      case 'director':
        return <Badge variant="default" className="gap-1"><Icon className="h-3 w-3" />{t('roles.director')}</Badge>;
      case 'senior':
        return <Badge variant="secondary" className="gap-1"><Icon className="h-3 w-3" />{t('roles.senior')}</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Icon className="h-3 w-3" />{t('roles.employee')}</Badge>;
    }
  };

  const handleBlock = (user: UserItem) => {
    console.log('Block/unblock user:', user.id);
  };

  const handleDelete = (user: UserItem) => {
    console.log('Delete user:', user.id);
  };

  const handleAssignRole = (user: UserItem, role: 'director' | 'senior') => {
    console.log('Assign role:', user.id, role);
  };

  const handleSendMessage = () => {
    console.log('Send message to:', selectedUser?.id, message);
    setIsMessageDialogOpen(false);
    setSelectedUser(null);
    setMessage('');
  };

  const filteredUsers = users.filter((user) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.companyName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('menu.users')}</h1>

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.sendMessage')}</DialogTitle>
            <DialogDescription>
              Сообщение для {selectedUser?.fullName}
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

      {/* User Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Информация о пользователе</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(selectedUser.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{selectedUser.fullName}</p>
                  {getRoleBadge(selectedUser.role)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {selectedUser.email}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {selectedUser.phone}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {selectedUser.companyName || 'Без компании'}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Дата регистрации: {selectedUser.createdAt}</span>
                {selectedUser.isBlocked && <Badge variant="destructive">Заблокирован</Badge>}
              </div>
            </div>
          )}
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
                <TableHead>Пользователь</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Компания</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow 
                  key={user.id} 
                  className={`cursor-pointer ${user.isBlocked ? 'opacity-60' : ''}`}
                  onClick={() => {
                    setSelectedUser(user);
                    setIsDetailDialogOpen(true);
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{user.companyName || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.activityType === 'declarant' ? t('auth.declarant') : t('auth.certification')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <Badge variant="destructive">Заблокирован</Badge>
                    ) : (
                      <Badge variant="default">Активен</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.createdAt}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user);
                          setIsMessageDialogOpen(true);
                        }}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {t('admin.sendMessage')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAssignRole(user, 'director')}>
                          <Crown className="h-4 w-4 mr-2" />
                          {t('admin.assignDirector')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignRole(user, 'senior')}>
                          <Star className="h-4 w-4 mr-2" />
                          {t('admin.assignSenior')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleBlock(user)}>
                          {user.isBlocked ? (
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
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(user)}
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
