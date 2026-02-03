import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Страница не найдена</p>
      <Button onClick={() => navigate('/login')} className="gap-2">
        <Home className="h-4 w-4" />
        На главную
      </Button>
    </div>
  );
};

export default NotFound;
