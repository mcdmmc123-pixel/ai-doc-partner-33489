import { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
}

export const FileUpload = ({ onFilesUploaded }: FileUploadProps) => {
  const { toast } = useToast();

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesUploaded(files);
        toast({
          title: 'Files uploaded',
          description: `${files.length} file(s) ready for analysis`,
        });
      }
    },
    [onFilesUploaded, toast]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesUploaded(files);
      toast({
        title: 'Files uploaded',
        description: `${files.length} file(s) ready for analysis`,
      });
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer bg-gradient-card"
    >
      <input
        type="file"
        multiple
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
        accept=".py,.js,.ts,.jsx,.tsx,.json,.md,.txt,.yml,.yaml"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2 text-foreground">Upload Project Files</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop your project files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Supports: Python, JavaScript, TypeScript, JSON, Markdown, YAML
        </p>
      </label>
    </div>
  );
};
