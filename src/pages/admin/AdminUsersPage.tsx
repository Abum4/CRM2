import { useState, useEffect } from 'react';
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
import { api } from '@/api';
import { UserWithRole, UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [message, setMessage] = useState('');

  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.users.getAll(page);
      if (response && response.data) {
        setUsers(response.data);
        setTotal(response.total || 0);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to load users'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'director': return Crown;
      case 'senior': return Star;
      default: return User;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const Icon = getRoleIcon(role);
    switch (role) {
      case 'director':
        return <Badge variant="default" className="gap-1"><Icon className="h-3 w-3" />{t('roles.director')}</Badge>;
      case 'senior':
        return <Badge variant="secondary" className="gap-1"><Icon className="h-3 w-3" />{t('roles.senior')}</Badge>;
      case 'admin':
        return <Badge variant="destructive" className="gap-1"><Icon className="h-3 w-3" />Admin</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Icon className="h-3 w-3" />{t('roles.employee')}</Badge>;
    }
  };

  const handleBlock = async (user: UserWithRole) => {
    try {
      if (user.isBlocked) {
        await api.users.unblock(user.id);
        toast({ title: "Пользователь разблокирован" });
      } else {
        await api.users.block(user.id);
        toast({ title: "Пользователь заблокирован" });
      }
      fetchUsers();
    } catch (error) {
      toast({ variant: 'destructive', title: "Ошибка при изменении статуса" });
    }
  };

  const handleDelete = async (user: UserWithRole) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя навсегда?')) return;
    try {
      await api.users.delete(user.id);
      toast({ title: "Пользователь удален" });
      fetchUsers();
    } catch (error) {
      toast({ variant: 'destructive', title: "Ошибка удаления" });
    }
  };

  const handleAssignRole = async (user: UserWithRole, role: 'director' | 'senior' | 'employee') => {
    try {
      await api.users.assignRole(user.id, role);
      toast({ title: "Роль обновлена" });
      fetchUsers();
    } catch (error) {
      toast({ variant: 'destructive', title: "Ошибка назначения роли" });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser) return;
    try {
      await api.users.sendMessage(selectedUser.id, message);
      toast({ title: "Сообщение отправлено" });
      setIsMessageDialogOpen(false);
      setSelectedUser(null);
      setMessage('');
    } catch (error) {
      toast({ variant: 'destructive', title: "Ошибка отправки" });
    }
  };

  const filteredUsers = users.filter((user) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('menu.users')}</h1>
        <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
          Обновить
        </Button>
      </div>

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
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Дата регистрации: {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
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
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Загрузка...</TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Пользователи не найдены</TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
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
                    <TableCell className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
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
                )))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
