import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiDocViewerProps {
  apiDoc: string;
  onDownload: () => void;
}

export const ApiDocViewer = ({ apiDoc, onDownload }: ApiDocViewerProps) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
    toast({
      title: 'Copied!',
      description: 'Code snippet copied to clipboard',
    });
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/resources',
      description: 'Retrieve list of resources with pagination',
      status: '200 OK'
    },
    {
      method: 'GET',
      path: '/api/resources/:id',
      description: 'Get specific resource by ID',
      status: '200 OK'
    },
    {
      method: 'POST',
      path: '/api/resources',
      description: 'Create new resource',
      status: '201 Created'
    },
    {
      method: 'PUT',
      path: '/api/resources/:id',
      description: 'Update existing resource',
      status: '200 OK'
    },
    {
      method: 'DELETE',
      path: '/api/resources/:id',
      description: 'Delete resource',
      status: '200 OK'
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'POST': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'PUT': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'DELETE': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const codeExamples = {
    javascript: `const API_BASE = 'https://api.yourapp.com/v1';
const API_TOKEN = 'your_api_token';

async function getResources() {
  const response = await fetch(\`\${API_BASE}/resources?page=1&limit=10\`, {
    headers: {
      'Authorization': \`Bearer \${API_TOKEN}\`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}`,
    python: `import requests

API_BASE = 'https://api.yourapp.com/v1'
API_TOKEN = 'your_api_token'

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

def get_resources():
    response = requests.get(
        f'{API_BASE}/resources',
        headers=headers,
        params={'page': 1, 'limit': 10}
    )
    return response.json()`,
    curl: `curl -X GET "https://api.yourapp.com/v1/resources?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json"`
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">API Documentation</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete API reference with examples and data models
          </p>
        </div>
        <Button onClick={onDownload} className="shadow-glow">
          <Download className="w-4 h-4 mr-2" />
          Download API Docs
        </Button>
      </div>

      <Card className="border-border bg-gradient-card animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-primary">Endpoints</span>
            <Badge variant="secondary">{endpoints.length} endpoints</Badge>
          </CardTitle>
          <CardDescription>
            RESTful API endpoints for your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {endpoints.map((endpoint, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border border-border hover:border-primary/50 transition-all duration-300 hover-scale"
            >
              <Badge className={getMethodColor(endpoint.method)}>
                {endpoint.method}
              </Badge>
              <div className="flex-1 min-w-0">
                <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                <p className="text-sm text-muted-foreground mt-1">{endpoint.description}</p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {endpoint.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border bg-gradient-card animate-scale-in">
        <CardHeader>
          <CardTitle className="text-primary">Code Examples</CardTitle>
          <CardDescription>
            Integration examples in multiple programming languages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="javascript" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sticky top-0 z-10 bg-background">
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>
            
            {Object.entries(codeExamples).map(([lang, code]) => (
              <TabsContent key={lang} value={lang} className="mt-4">
                <div className="relative group">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code className="text-foreground font-mono">{code}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(code, lang)}
                  >
                    {copiedSection === lang ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-border bg-gradient-card animate-scale-in">
        <CardHeader>
          <CardTitle className="text-primary">Data Models</CardTitle>
          <CardDescription>
            TypeScript interfaces and data structures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-foreground font-mono">
{`interface Resource {
  id: string;              // UUID v4
  name: string;            // Max 255 characters
  description?: string;    // Optional
  status: 'active' | 'inactive' | 'pending';
  metadata?: {
    tags?: string[];
    category?: string;
  };
  created_at: string;      // ISO 8601
  updated_at: string;      // ISO 8601
}`}
            </code>
          </pre>
        </CardContent>
      </Card>

      <Card className="border-border bg-gradient-card animate-scale-in">
        <CardHeader>
          <CardTitle className="text-primary">Authentication</CardTitle>
          <CardDescription>
            API authentication and authorization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Bearer Token</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Include your API token in the Authorization header:
            </p>
            <pre className="bg-muted p-3 rounded text-sm">
              <code className="text-foreground font-mono">
                Authorization: Bearer YOUR_API_TOKEN
              </code>
            </pre>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Rate Limits</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-background/50 rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">100</div>
                <div className="text-xs text-muted-foreground">per minute</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">1K</div>
                <div className="text-xs text-muted-foreground">per hour</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">10K</div>
                <div className="text-xs text-muted-foreground">per day</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
