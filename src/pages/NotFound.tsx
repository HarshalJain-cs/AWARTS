import { Link } from "react-router-dom";
import { SEO } from '@/components/SEO';

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SEO title="404 — Page Not Found" description="The page you're looking for doesn't exist on AWARTS." noindex />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
