import { useEffect, useState } from 'react';
import ReactFlow, { Node, Edge, Background, Controls, MiniMap, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, FileCode } from 'lucide-react';

interface CodeFlowVisualizationProps {
  files: File[];
}

interface FileNode {
  name: string;
  path: string;
  type: string;
  imports: string[];
  exports: string[];
}

export const CodeFlowVisualization = ({ files }: CodeFlowVisualizationProps) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [layout, setLayout] = useState<'hierarchical' | 'circular'>('hierarchical');

  const parseFileContent = async (file: File): Promise<FileNode> => {
    const content = await file.text();
    const fileType = file.name.split('.').pop() || 'unknown';
    const imports: string[] = [];
    const exports: string[] = [];

    // Parse imports based on file type
    if (['ts', 'tsx', 'js', 'jsx'].includes(fileType)) {
      // TypeScript/JavaScript imports
      const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      // Exports
      const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
      while ((match = exportRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }
    } else if (fileType === 'py') {
      // Python imports
      const importRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1] || match[2]);
      }
    } else if (['java', 'cpp', 'c', 'h'].includes(fileType)) {
      // Java/C++ imports
      const importRegex = /(?:import|#include)\s+[<"]([^>"]+)[>"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    } else if (fileType === 'go') {
      // Go imports
      const importRegex = /import\s+(?:\([\s\S]*?\)|"([^"]+)")/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        if (match[1]) imports.push(match[1]);
      }
    }

    return {
      name: file.name,
      path: file.name,
      type: fileType,
      imports,
      exports
    };
  };

  useEffect(() => {
    if (files.length === 0) return;

    const buildGraph = async () => {
      const fileNodes: FileNode[] = await Promise.all(
        files.map(file => parseFileContent(file))
      );

      const generatedNodes: Node[] = [];
      const generatedEdges: Edge[] = [];
      const fileMap = new Map<string, number>();

      fileNodes.forEach((fileNode, index) => {
        fileMap.set(fileNode.name, index);
        fileMap.set(fileNode.path, index);
      });

      const columns = Math.ceil(Math.sqrt(fileNodes.length));

      fileNodes.forEach((fileNode, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const nodeColor = getNodeColor(fileNode.type);

        generatedNodes.push({
          id: `${index}`,
          type: 'default',
          data: {
            label: (
              <div className="text-xs space-y-1">
                <div className="font-semibold truncate max-w-[140px]" title={fileNode.name}>
                  {fileNode.name}
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {fileNode.type}
                </Badge>
                {fileNode.exports.length > 0 && (
                  <div className="text-[9px] text-muted-foreground">
                    {fileNode.exports.length} exports
                  </div>
                )}
              </div>
            )
          },
          position: { 
            x: layout === 'hierarchical' ? col * 220 : Math.cos((index * 2 * Math.PI) / fileNodes.length) * 300 + 400,
            y: layout === 'hierarchical' ? row * 140 : Math.sin((index * 2 * Math.PI) / fileNodes.length) * 300 + 400
          },
          style: {
            background: nodeColor,
            border: '2px solid hsl(var(--border))',
            borderRadius: '8px',
            padding: '12px',
            width: 180,
          },
        });

        fileNode.imports.forEach(importPath => {
          const normalizedImport = importPath.split('/').pop()?.replace(/['"]/g, '') || importPath;
          
          fileNodes.forEach((targetNode, targetIndex) => {
            if (targetNode.name.includes(normalizedImport) || 
                normalizedImport.includes(targetNode.name.split('.')[0])) {
              generatedEdges.push({
                id: `e${index}-${targetIndex}`,
                source: `${index}`,
                target: `${targetIndex}`,
                type: 'smoothstep',
                animated: true,
                style: { stroke: 'hsl(var(--primary))' },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: 'hsl(var(--primary))',
                },
                label: 'imports',
                labelStyle: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
              });
            }
          });
        });
      });

      setNodes(generatedNodes);
      setEdges(generatedEdges);
    };

    buildGraph();
  }, [files, layout]);

  const getNodeColor = (fileType: string) => {
    const colors: Record<string, string> = {
      ts: 'hsl(217, 91%, 60%)',
      tsx: 'hsl(217, 91%, 60%)',
      js: 'hsl(53, 93%, 54%)',
      jsx: 'hsl(53, 93%, 54%)',
      py: 'hsl(142, 71%, 45%)',
      java: 'hsl(19, 89%, 55%)',
      cpp: 'hsl(263, 70%, 50%)',
      c: 'hsl(263, 70%, 50%)',
      h: 'hsl(263, 70%, 50%)',
      go: 'hsl(178, 60%, 50%)',
      rs: 'hsl(26, 85%, 55%)',
      json: 'hsl(39, 100%, 50%)',
      md: 'hsl(271, 76%, 53%)',
    };
    return colors[fileType] || 'hsl(var(--muted))';
  };

  if (files.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Code Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Upload files to visualize code flow
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Network className="w-4 h-4" />
          Code Flow Visualization
        </CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={layout === 'hierarchical' ? 'default' : 'outline'}
            onClick={() => setLayout('hierarchical')}
            className="h-7 text-xs"
          >
            Hierarchical
          </Button>
          <Button
            size="sm"
            variant={layout === 'circular' ? 'default' : 'outline'}
            onClick={() => setLayout('circular')}
            className="h-7 text-xs"
          >
            Circular
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        <div className="absolute inset-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            attributionPosition="bottom-left"
            minZoom={0.1}
            maxZoom={2}
          >
            <Background />
            <Controls />
            <MiniMap 
              nodeColor={(node) => node.style?.background as string || 'hsl(var(--muted))'} 
              style={{ height: 100 }}
            />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
};
