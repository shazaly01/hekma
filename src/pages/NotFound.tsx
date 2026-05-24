import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center space-y-4">
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">عذراً! الصفحة التي تبحث عنها غير موجودة</p>
        <Button asChild variant="default">
          <Link to="/">العودة للرئيسية</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
