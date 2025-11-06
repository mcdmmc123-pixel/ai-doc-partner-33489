import { FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SmartSuggestionsProps {
  suggestions: string[];
}

export const SmartSuggestions = ({ suggestions }: SmartSuggestionsProps) => {
  if (suggestions.length === 0) return null;

  return (
    <Alert className="bg-primary/5 border-primary/20">
      <AlertCircle className="h-4 w-4 text-primary" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Suggested Files to Add:</p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            {suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <FileText className="w-3 h-3" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
};
