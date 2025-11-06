import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReadmePreviewProps {
  content: string;
}

export const ReadmePreview = ({ content }: ReadmePreviewProps) => {
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-card border border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">README.md Preview</h2>
          <p className="text-sm text-muted-foreground">Live documentation</p>
        </div>
        <Button onClick={handleDownload} disabled={!content} size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {content ? (
            <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary/50 p-4 rounded-lg text-foreground">
              {content}
            </pre>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              Your README will appear here as you answer questions
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
