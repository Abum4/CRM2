import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  FileText,
  Award,
  CheckSquare,
  FolderOpen,
  Users,
  Building2,
  UserCog,
  Inbox,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roles?: ('director' | 'senior' | 'employee')[];
}

const declarantMenu: MenuItem[] = [
  { icon: LayoutDashboard, label: 'menu.dashboard', path: '/dashboard' },
  { icon: FileText, label: 'menu.declarations', path: '/declarations' },
  { icon: Award, label: 'menu.certificates', path: '/certificates' },
  { icon: CheckSquare, label: 'menu.tasks', path: '/tasks' },
  { icon: FolderOpen, label: 'menu.documents', path: '/documents' },
  { icon: Users, label: 'menu.clients', path: '/clients' },
  { icon: Building2, label: 'menu.partners', path: '/partners' },
  { icon: UserCog, label: 'menu.employees', path: '/employees', roles: ['director', 'senior'] },
  { icon: Inbox, label: 'menu.requests', path: '/requests', roles: ['director'] },
];

const certificationMenu: MenuItem[] = [
  { icon: LayoutDashboard, label: 'menu.dashboard', path: '/dashboard' },
  { icon: Award, label: 'menu.certificates', path: '/certificates' },
  { icon: CheckSquare, label: 'menu.tasks', path: '/tasks' },
  { icon: FolderOpen, label: 'menu.documents', path: '/documents' },
  { icon: Users, label: 'menu.clients', path: '/clients' },
  { icon: Building2, label: 'menu.partners', path: '/partners' },
  { icon: UserCog, label: 'menu.employees', path: '/employees', roles: ['director', 'senior'] },
  { icon: Inbox, label: 'menu.requests', path: '/requests', roles: ['director'] },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, company, logout } = useAuth();

  if (!user) return null;

  const activityType = user.activityType || 'declarant';
  const menu = activityType === 'declarant' ? declarantMenu : certificationMenu;

  const filteredMenu = menu.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user.role as 'director' | 'senior' | 'employee');
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.fullName}</p>
            <p className="text-sm text-muted-foreground truncate">{user.phone}</p>
          </div>
        </div>
        {company && (
          <div className="mt-3 px-1">
            <p className="text-xs text-muted-foreground">{company.name}</p>
            <p className="text-xs text-muted-foreground">ИНН: {company.inn}</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenu.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={item.path}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{t(item.label)}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/settings'}>
              <NavLink
                to="/settings"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  location.pathname === '/settings'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Settings className="h-5 w-5" />
                <span>{t('menu.settings')}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>{t('auth.logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
