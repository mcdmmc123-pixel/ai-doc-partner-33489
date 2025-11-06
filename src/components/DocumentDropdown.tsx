import { useState } from 'react';
import { ChevronDown, FileText, Code, Book, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface DocumentDropdownProps {
  documents: Array<{ name: string; content: string }>;
  onSelectDocument: (doc: { name: string; content: string }) => void;
  selectedDocument?: { name: string; content: string };
  onDownloadAll: () => void;
}

const getDocIcon = (name: string) => {
  if (name.includes('README')) return FileText;
  if (name.includes('API')) return Code;
  return Book;
};

export const DocumentDropdown = ({
  documents,
  onSelectDocument,
  selectedDocument,
  onDownloadAll,
}: DocumentDropdownProps) => {
  const [open, setOpen] = useState(false);

  if (documents.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[200px] justify-between bg-card hover:bg-accent/10 border-border/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/20"
          >
            <div className="flex items-center gap-2">
              {selectedDocument ? (
                <>
                  {(() => {
                    const Icon = getDocIcon(selectedDocument.name);
                    return <Icon className="h-4 w-4 text-accent" />;
                  })()}
                  <span className="text-sm font-medium">{selectedDocument.name}</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Select Document</span>
                </>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[240px] bg-card/95 backdrop-blur-xl border-border/50 shadow-xl animate-in slide-in-from-top-2 duration-300 z-50"
        >
          {documents.map((doc, index) => {
            const Icon = getDocIcon(doc.name);
            return (
              <DropdownMenuItem
                key={index}
                onClick={() => {
                  onSelectDocument(doc);
                  setOpen(false);
                }}
                className="cursor-pointer hover:bg-accent/10 transition-colors duration-200 group"
              >
                <Icon className="h-4 w-4 mr-2 text-accent group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm">{doc.name}</span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator className="bg-border/50" />
          <DropdownMenuItem
            onClick={() => {
              onDownloadAll();
              setOpen(false);
            }}
            className="cursor-pointer hover:bg-accent/10 transition-colors duration-200 group"
          >
            <Download className="h-4 w-4 mr-2 text-accent group-hover:scale-110 transition-transform duration-200" />
            <span className="text-sm font-medium">Download All</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
