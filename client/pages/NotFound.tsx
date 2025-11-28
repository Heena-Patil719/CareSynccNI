import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h1 className="text-4xl font-display font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground text-lg mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/">
          <Button className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
  );
}
