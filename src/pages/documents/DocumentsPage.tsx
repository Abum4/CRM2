import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  FolderPlus,
  Upload,
  Search,
  Folder,
  FileText,
  FileImage,
  File,
  MoreVertical,
  Trash2,
  Download,
  Lock,
  Globe,
  Users,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AccessType } from '@/types';

interface FolderItem {
  id: string;
  name: string;
  accessType: AccessType;
  itemCount: number;
}

interface FileItem {
  id: string;
  name: string;
  fileType: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

const getFileIcon = (type: string) => {
  if (type.includes('image')) return FileImage;
  if (type.includes('pdf') || type.includes('document')) return FileText;
  return File;
};

export default function DocumentsPage() {
  const { t } = useTranslation();
  const { isDirectorOrSenior } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [accessType, setAccessType] = useState<AccessType>('public');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Mock data
  const folders: FolderItem[] = [
    { id: '1', name: 'Декларации 2026', accessType: 'public', itemCount: 15 },
    { id: '2', name: 'Сертификаты', accessType: 'public', itemCount: 8 },
    { id: '3', name: 'Личные документы', accessType: 'private', itemCount: 5 },
    { id: '4', name: 'Для команды', accessType: 'selected', itemCount: 12 },
  ];

  const files: FileItem[] = [
    { id: '1', name: 'Договор_ООО_Клиент.pdf', fileType: 'application/pdf', size: '2.4 MB', uploadedBy: 'Иванов И.И.', uploadedAt: '29.01.2026' },
    { id: '2', name: 'Счёт_123.xlsx', fileType: 'application/xlsx', size: '156 KB', uploadedBy: 'Петрова М.А.', uploadedAt: '28.01.2026' },
    { id: '3', name: 'Сканы_документов.zip', fileType: 'application/zip', size: '15.8 MB', uploadedBy: 'Сидоров А.В.', uploadedAt: '27.01.2026' },
  ];

  const employees = [
    { id: '1', name: 'Иванов И.И.' },
    { id: '2', name: 'Петрова М.А.' },
    { id: '3', name: 'Сидоров А.В.' },
  ];

  const clients = [
    { id: '1', name: 'ООО "Клиент"' },
    { id: '2', name: 'ИП Петров' },
    { id: '3', name: 'ООО "Торговля"' },
  ];

  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(empId) 
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const handleCreateFolder = () => {
    console.log({
      folderName,
      accessType,
      selectedEmployees: accessType === 'selected' ? selectedEmployees : [],
    });
    setIsCreateFolderOpen(false);
    setFolderName('');
    setAccessType('public');
    setSelectedEmployees([]);
  };

  const getAccessIcon = (type: AccessType) => {
    switch (type) {
      case 'private': return Lock;
      case 'public': return Globe;
      case 'selected': return Users;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('documents.title')}</h1>
        
        <div className="flex gap-2">
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FolderPlus className="h-4 w-4" />
                {t('documents.createFolder')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('documents.createFolder')}</DialogTitle>
                <DialogDescription>
                  Создайте папку и настройте доступ к ней
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t('documents.folderName')} *</Label>
                  <Input
                    placeholder="Название папки"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('documents.access.title')} *</Label>
                  <RadioGroup value={accessType} onValueChange={(v) => setAccessType(v as AccessType)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private" className="cursor-pointer flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        {t('documents.access.private')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public" className="cursor-pointer flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {t('documents.access.public')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="selected" id="selected" />
                      <Label htmlFor="selected" className="cursor-pointer flex items-center gap-2">
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
                            id={emp.id}
                            checked={selectedEmployees.includes(emp.id)}
                            onCheckedChange={() => toggleEmployeeSelection(emp.id)}
                          />
                          <Label htmlFor={emp.id} className="cursor-pointer">
                            {emp.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateFolder}>
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            {t('documents.uploadFile')}
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      {currentPath.length > 0 && (
        <div className="flex items-center gap-1 text-sm">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentPath([])}
          >
            {t('documents.title')}
          </Button>
          {currentPath.map((segment, index) => (
            <div key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
              >
                {segment}
              </Button>
            </div>
          ))}
        </div>
      )}

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
            
            {isDirectorOrSenior && (
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('documents.byEmployee')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('documents.byClient')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Files and Folders Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {/* Folders */}
        {folders.map((folder) => {
          const AccessIcon = getAccessIcon(folder.accessType);
          return (
            <ContextMenu key={folder.id}>
              <ContextMenuTrigger>
                <Card 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setCurrentPath([...currentPath, folder.name])}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="relative">
                      <Folder className="h-12 w-12 text-primary mb-2" />
                      <AccessIcon className="h-4 w-4 absolute -bottom-1 -right-1 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-sm truncate w-full">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">{folder.itemCount} файлов</p>
                  </CardContent>
                </Card>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete')}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}

        {/* Files */}
        {files.map((file) => {
          const FileIcon = getFileIcon(file.fileType);
          return (
            <ContextMenu key={file.id}>
              <ContextMenuTrigger>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <FileIcon className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="font-medium text-sm truncate w-full">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </CardContent>
                </Card>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Скачать
                </ContextMenuItem>
                <ContextMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete')}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>
    </div>
  );
}
