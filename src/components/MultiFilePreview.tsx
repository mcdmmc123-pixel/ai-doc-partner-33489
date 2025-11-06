import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentFile {
  name: string;
  content: string;
  icon?: React.ReactNode;
}

interface MultiFilePreviewProps {
  documents: DocumentFile[];
}

export const MultiFilePreview = ({ documents }: MultiFilePreviewProps) => {
  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    documents.forEach(doc => {
      downloadFile(doc.name, doc.content);
    });
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col h-full bg-card rounded-lg shadow-card border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Documentation Preview</h2>
          <p className="text-sm text-muted-foreground">Files will appear here</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-center py-12">
            Your documentation will appear here as you answer questions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 border-b border-border flex items-center justify-between bg-card">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Documentation</h2>
          <p className="text-xs text-muted-foreground">{documents.length} file(s)</p>
        </div>
        <Button onClick={downloadAll} size="sm" variant="ghost">
          <Download className="w-3 h-3 mr-1" />
          All
        </Button>
      </div>

      <Tabs defaultValue={documents[0]?.name} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 pt-2 bg-card">
          <TabsList className="w-full justify-start h-8 overflow-x-auto">
            {documents.map((doc) => (
              <TabsTrigger key={doc.name} value={doc.name} className="flex items-center gap-1 text-xs h-7">
                <FileText className="w-3 h-3" />
                {doc.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {documents.map((doc) => (
          <TabsContent key={doc.name} value={doc.name} className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-semibold text-foreground m-0">{doc.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(doc.name, doc.content)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                    </Button>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs bg-secondary/50 p-3 rounded-lg text-foreground">
                    {doc.content}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
