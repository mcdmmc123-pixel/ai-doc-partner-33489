import { useState, useCallback, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ChatInterface } from '@/components/ChatInterface';
import { MultiFilePreview } from '@/components/MultiFilePreview';
import { QualityScore } from '@/components/QualityScore';
import { PersonaSelector } from '@/components/PersonaSelector';
import { SmartSuggestions } from '@/components/SmartSuggestions';
import { ApiDocViewer } from '@/components/ApiDocViewer';
import { CodeFlowVisualization } from '@/components/CodeFlowVisualization';
import { FloatingChatBot } from '@/components/FloatingChatBot';
import { DocumentDropdown } from '@/components/DocumentDropdown';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sparkles, FileText, Code, Network, ArrowLeft, ArrowRight, Home, GraduationCap } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import analysisIcon from '@/assets/analysis-icon.png';
import previewIcon from '@/assets/preview-icon.png';
import apiIcon from '@/assets/api-icon.png';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateReadme, generateContributing, generateApiReference, generateInstallationGuide } from '@/lib/documentTemplates';
import { isVSCode, onVSCodeMessage, sendMessageToVSCode, saveState, getState } from '@/lib/vscode';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Array<{ name: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [qualityScore, setQualityScore] = useState(0);
  const [persona, setPersona] = useState('professional');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conversationData, setConversationData] = useState<Record<string, string>>({});
  const [activeView, setActiveView] = useState<'chat' | 'docs' | 'flow' | 'api'>('chat');
  const [combinedTabs, setCombinedTabs] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>(['home']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<{ name: string; content: string } | undefined>();
  const [showTransition, setShowTransition] = useState(false);
  const { toast } = useToast();
  const inVSCode = isVSCode();

  // Restore state and listen for VS Code messages
  useEffect(() => {
    if (inVSCode) {
      const savedState = getState();
      if (savedState) {
        if (savedState.files) setFiles(savedState.files);
        if (savedState.documents) setDocuments(savedState.documents);
        if (savedState.hasStarted) setHasStarted(savedState.hasStarted);
        if (savedState.qualityScore) setQualityScore(savedState.qualityScore);
      }
      
      const cleanup = onVSCodeMessage((message) => {
        if (message.type === 'filesFromWorkspace') {
          handleFilesUploaded(message.files);
        } else if (message.type === 'analyzeCode') {
          autoGenerateReadme();
        }
      });
      
      return cleanup;
    }
  }, [inVSCode]);

  const navigateTo = useCallback((location: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(location);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const previousLocation = history[historyIndex - 1];
      if (previousLocation === 'home') {
        setHasStarted(false);
        setCombinedTabs([]);
      } else {
        setActiveView(previousLocation as any);
      }
    }
  }, [historyIndex, history]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextLocation = history[historyIndex + 1];
      if (nextLocation === 'home') {
        setHasStarted(false);
        setCombinedTabs([]);
      } else {
        setActiveView(nextLocation as any);
      }
    }
  }, [historyIndex, history]);

  const goHome = useCallback(() => {
    navigateTo('home');
    setHasStarted(false);
    setFiles([]);
    setMessages([]);
    setDocuments([]);
    setQualityScore(0);
    setSuggestions([]);
    setConversationData({});
    setActiveView('chat');
    setCombinedTabs([]);
  }, [navigateTo]);

  const downloadAllDocuments = () => {
    documents.forEach(doc => {
      const blob = new Blob([doc.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    
    toast({
      title: 'Documents Downloaded',
      description: `${documents.length} file(s) have been downloaded`,
    });
  };

  const handleFilesUploaded = async (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
    
    if (inVSCode) {
      saveState({ files: uploadedFiles, hasStarted });
      sendMessageToVSCode({ type: 'analyzeFiles', files: uploadedFiles });
    }
    
    toast({
      title: "Files uploaded",
      description: `${uploadedFiles.length} file(s) ready for deep code analysis`,
    });
  };

  const autoGenerateReadme = async () => {
    setShowTransition(true);
    
    setTimeout(() => {
      setShowTransition(false);
      setHasStarted(true);
      setIsLoading(true);
    }, 1200);

    setTimeout(async () => {

    try {
      const fileData = await Promise.all(
        files.map(async (file) => {
          try {
            const content = await file.text();
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              content: content,
            };
          } catch (error) {
            console.error(`Error reading file ${file.name}:`, error);
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              content: '',
            };
          }
        })
      );

      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body: {
          files: fileData,
          messages: [],
          persona,
          autoGenerate: true,
        },
      });

      if (error) throw error;

      setMessages([
        {
          role: 'assistant',
          content: 'I\'ve analyzed your code and generated comprehensive documentation automatically.',
        },
      ]);

      // Directly populate conversation data from AI response
      if (data.extractedData) {
        setConversationData(data.extractedData);
      }

      setQualityScore(data.qualityScore || 80);
      
      // Generate all documentation immediately
      const techStack = files.map(f => f.name);
      const docs = [
        {
          name: 'README.md',
          content: data.generatedReadme || generateReadme(data.extractedData || {}, persona),
        },
        {
          name: 'CONTRIBUTING.md',
          content: generateContributing(),
        },
        {
          name: 'API_REFERENCE.md',
          content: generateApiReference(techStack),
        },
        {
          name: 'INSTALLATION.md',
          content: generateInstallationGuide(techStack),
        },
      ];
      
      setDocuments(docs);
      setSelectedDocument(docs[0]);
      setSuggestions(data.suggestions || []);
      
      toast({
        title: 'Documentation Generated',
        description: 'Your README and supporting docs are ready!',
      });
    } catch (error: any) {
      console.error('Error generating documentation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate documentation.',
        variant: 'destructive',
      });
      setHasStarted(false);
    } finally {
      setIsLoading(false);
    }
    }, 1200);
  };

  const startInterview = async () => {
    setHasStarted(true);
    setIsLoading(true);

    try {
      const fileData = await Promise.all(
        files.map(async (file) => {
          try {
            const content = await file.text();
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              content: content,
            };
          } catch (error) {
            console.error(`Error reading file ${file.name}:`, error);
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              content: '',
            };
          }
        })
      );

      const initialMessage = {
        role: 'user' as const,
        content: `I've uploaded ${files.length} files. Please analyze them and start the interview.`,
      };

      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body: {
          files: fileData,
          messages: [initialMessage],
          persona,
          autoGenerate: false,
        },
      });

      if (error) throw error;

      setMessages([
        {
          role: 'assistant',
          content: data.response,
        },
      ]);

      setQualityScore(data.qualityScore || 0);
      setSuggestions(data.suggestions || []);
    } catch (error: any) {
      console.error('Error starting interview:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start interview. Please try again.',
        variant: 'destructive',
      });
      setHasStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    const newMessages = [...messages, { role: 'user' as const, content: message }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Extract key information from conversation
      const lastQuestion = messages[messages.length - 1]?.content.toLowerCase() || '';
      if (lastQuestion.includes('purpose') || lastQuestion.includes('main')) {
        setConversationData(prev => ({ ...prev, description: message }));
      } else if (lastQuestion.includes('features') || lastQuestion.includes('capabilities')) {
        setConversationData(prev => ({ ...prev, features: message }));
      } else if (lastQuestion.includes('install') || lastQuestion.includes('setup')) {
        setConversationData(prev => ({ ...prev, installation: message }));
      } else if (lastQuestion.includes('usage') || lastQuestion.includes('use')) {
        setConversationData(prev => ({ ...prev, usage: message }));
      } else if (lastQuestion.includes('name')) {
        setConversationData(prev => ({ ...prev, projectName: message }));
      }

      const fileData = await Promise.all(
        files.map(async (file) => {
          try {
            const content = await file.text();
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              content: content,
            };
          } catch (error) {
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              content: '',
            };
          }
        })
      );

      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body: {
          files: fileData,
          messages: newMessages,
          persona,
        },
      });

      if (error) {
        if (error.message?.includes('Rate limit')) {
          toast({
            title: 'Rate Limit Exceeded',
            description: 'Please wait a moment before sending another message.',
            variant: 'destructive',
          });
        } else if (error.message?.includes('credits')) {
          toast({
            title: 'AI Credits Depleted',
            description: 'Please add credits to your workspace to continue.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        setMessages(newMessages);
        setIsLoading(false);
        return;
      }

      const assistantMessage = {
        role: 'assistant' as const,
        content: data.response,
      };

      setMessages([...newMessages, assistantMessage]);
      setQualityScore(data.qualityScore || qualityScore);
      
      // Generate multi-file documentation
      if (data.qualityScore >= 60) {
        const techStack = files.map(f => f.name);
        const updatedDocs = [
          {
            name: 'README.md',
            content: generateReadme(conversationData, persona),
          },
          {
            name: 'CONTRIBUTING.md',
            content: generateContributing(),
          },
        ];

        if (data.qualityScore >= 80) {
          updatedDocs.push({
            name: 'API_REFERENCE.md',
            content: generateApiReference(techStack),
          });
          updatedDocs.push({
            name: 'INSTALLATION.md',
            content: generateInstallationGuide(techStack),
          });
        }

        setDocuments(updatedDocs);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your message. Please try again.',
        variant: 'destructive',
      });
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Transition Animation */}
      {showTransition && (
        <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
          <GraduationCap className="w-32 h-32 text-accent animate-zoom-in" />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg shrink-0">
        <div className="chat-container">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={goBack}
                disabled={historyIndex === 0}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goForward}
                disabled={historyIndex === history.length - 1}
                className="h-8 w-8"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goHome}
                className="h-8 w-8"
              >
                <Home className="h-4 w-4" />
              </Button>
              <button 
                onClick={goHome}
                className="flex items-center gap-2 hover:opacity-80 transition-all duration-300 ml-2 group"
              >
                <Sparkles className="w-5 h-5 text-accent group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-semibold bg-gradient-to-r from-[hsl(var(--lovable-purple))] to-[hsl(var(--lovable-pink))] bg-clip-text text-transparent">NarratO</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              {documents.length > 0 && (
                <DocumentDropdown
                  documents={documents}
                  onSelectDocument={setSelectedDocument}
                  selectedDocument={selectedDocument}
                  onDownloadAll={downloadAllDocuments}
                />
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {!hasStarted ? (
          <div className="chat-container py-12 space-y-8">
            {/* Hero */}
            <div className="text-center space-y-4 py-12 animate-fade-in relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--lovable-purple)/0.1)] via-transparent to-[hsl(var(--lovable-pink)/0.1)] animate-shimmer" />
              <GraduationCap className="w-20 h-20 mx-auto text-accent mb-6 animate-float" />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight relative z-10">
                <span className="bg-gradient-to-r from-[hsl(var(--lovable-purple))] to-[hsl(var(--lovable-pink))] bg-clip-text text-transparent">
                  AI Documentation Assistant
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto relative z-10">
                Upload your code and let AI create professional documentation automatically
              </p>
            </div>

            {/* Upload Section */}
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="modern-card p-6 animate-slide-up">
                <PersonaSelector
                  selectedPersona={persona}
                  onSelectPersona={setPersona}
                />
              </div>
              
              <div className="modern-card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                <FileUpload onFilesUploaded={handleFilesUploaded} />
              </div>
              
              {files.length > 0 && (
                <div className="modern-card p-6 text-center space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
                  <p className="text-sm text-muted-foreground">
                    {files.length} file(s) ready
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={autoGenerateReadme} 
                      size="lg" 
                      className="rounded-xl hover-lift"
                      disabled={isLoading}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isLoading ? 'Generating...' : 'Auto-Generate'}
                    </Button>
                    <Button 
                      onClick={startInterview} 
                      size="lg" 
                      variant="outline"
                      className="rounded-xl hover-lift"
                      disabled={isLoading}
                    >
                      Interview Mode
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="chat-container py-8 space-y-6">
            {qualityScore > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="modern-card p-4 min-h-[140px]">
                  <QualityScore score={qualityScore} />
                </div>
                {suggestions.length > 0 && (
                  <div className="modern-card p-4 min-h-[140px] max-h-[200px] overflow-y-auto">
                    <SmartSuggestions suggestions={suggestions} />
                  </div>
                )}
              </div>
            )}

            <Tabs 
              value={activeView} 
              onValueChange={(v) => {
                navigateTo(v);
                setActiveView(v as any);
              }} 
              className="flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <TabsList className="grid w-full max-w-2xl grid-cols-4">
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="docs" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Docs
                  </TabsTrigger>
                  <TabsTrigger value="flow" className="flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    Flow
                  </TabsTrigger>
                  <TabsTrigger value="api" className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    API
                  </TabsTrigger>
                </TabsList>
                
                {combinedTabs.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCombinedTabs([])}
                    className="ml-4"
                  >
                    Single View
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-hidden min-h-0">
                {combinedTabs.length === 0 ? (
                  <>
                    <TabsContent value="chat" className="mt-0 h-full flex flex-col">
                      <div className="shrink-0 p-3 border-b bg-muted/30">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCombinedTabs(['chat', 'docs'])}
                        >
                          + Combine with Docs
                        </Button>
                      </div>
                      <div className="flex-1 modern-card overflow-hidden">
                        <ChatInterface
                          messages={messages}
                          onSendMessage={handleSendMessage}
                          isLoading={isLoading}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="docs" className="mt-0 h-full flex flex-col">
                      <div className="shrink-0 p-3 border-b bg-muted/30">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCombinedTabs(['docs', 'flow'])}
                        >
                          + Combine with Flow
                        </Button>
                      </div>
                      <div className="flex-1 modern-card overflow-y-auto p-6">
                        {selectedDocument ? (
                          <div className="prose dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap bg-muted/50 p-6 rounded-lg border border-border">
                              {selectedDocument.content}
                            </pre>
                          </div>
                        ) : documents.length > 0 ? (
                          <MultiFilePreview documents={documents} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-center">
                            <p className="text-muted-foreground">Documentation will appear here</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="flow" className="mt-0 h-full flex flex-col">
                      <div className="shrink-0 p-3 border-b bg-muted/30">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCombinedTabs(['flow', 'api'])}
                        >
                          + Combine with API
                        </Button>
                      </div>
                      <div className="flex-1 overflow-hidden modern-card">
                        <CodeFlowVisualization files={files} />
                      </div>
                    </TabsContent>

                    <TabsContent value="api" className="mt-0 h-full flex flex-col">
                      <div className="shrink-0 p-3 border-b bg-muted/30">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCombinedTabs(['api', 'chat'])}
                        >
                          + Combine with Chat
                        </Button>
                      </div>
                      <div className="flex-1 modern-card overflow-y-auto p-6">
                        <ApiDocViewer 
                          apiDoc={documents.find(d => d.name === 'API_REFERENCE.md')?.content || ''} 
                          onDownload={downloadAllDocuments}
                        />
                      </div>
                    </TabsContent>
                  </>
                ) : (
                  <div className="h-full">
                    <ResizablePanelGroup direction="horizontal" className="rounded-lg border border-border">
                      {combinedTabs.includes('chat') && (
                        <>
                          <ResizablePanel defaultSize={50} minSize={30}>
                            <div className="h-full modern-card overflow-hidden flex flex-col">
                              <div className="p-2 border-b border-border bg-muted/50 shrink-0 flex items-center justify-between">
                                <span className="text-sm font-medium">Chat</span>
                                <Button size="sm" variant="ghost" onClick={() => setCombinedTabs(combinedTabs.filter(t => t !== 'chat'))}>
                                  Close
                                </Button>
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <ChatInterface
                                  messages={messages}
                                  onSendMessage={handleSendMessage}
                                  isLoading={isLoading}
                                />
                              </div>
                            </div>
                          </ResizablePanel>
                          {combinedTabs.length > 1 && <ResizableHandle withHandle />}
                        </>
                      )}
                      
                      {combinedTabs.includes('docs') && (
                        <>
                          <ResizablePanel defaultSize={50} minSize={30}>
                            <div className="h-full modern-card overflow-hidden flex flex-col">
                              <div className="p-2 border-b border-border bg-muted/50 shrink-0 flex items-center justify-between">
                                <span className="text-sm font-medium">Documentation</span>
                                <Button size="sm" variant="ghost" onClick={() => setCombinedTabs(combinedTabs.filter(t => t !== 'docs'))}>
                                  Close
                                </Button>
                              </div>
                              <div className="flex-1 overflow-y-auto p-6">
                                {documents.length > 0 ? (
                                  <MultiFilePreview documents={documents} />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-center">
                                    <p className="text-muted-foreground">Documentation will appear here</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </ResizablePanel>
                          {combinedTabs.indexOf('docs') < combinedTabs.length - 1 && <ResizableHandle withHandle />}
                        </>
                      )}
                      
                      {combinedTabs.includes('flow') && (
                        <>
                          <ResizablePanel defaultSize={50} minSize={30}>
                            <div className="h-full modern-card overflow-hidden flex flex-col">
                              <div className="p-2 border-b border-border bg-muted/50 shrink-0 flex items-center justify-between">
                                <span className="text-sm font-medium">Code Flow</span>
                                <Button size="sm" variant="ghost" onClick={() => setCombinedTabs(combinedTabs.filter(t => t !== 'flow'))}>
                                  Close
                                </Button>
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <CodeFlowVisualization files={files} />
                              </div>
                            </div>
                          </ResizablePanel>
                          {combinedTabs.indexOf('flow') < combinedTabs.length - 1 && <ResizableHandle withHandle />}
                        </>
                      )}
                      
                      {combinedTabs.includes('api') && (
                        <ResizablePanel defaultSize={50} minSize={30}>
                          <div className="h-full modern-card overflow-hidden flex flex-col">
                            <div className="p-2 border-b border-border bg-muted/50 shrink-0 flex items-center justify-between">
                              <span className="text-sm font-medium">API Reference</span>
                              <Button size="sm" variant="ghost" onClick={() => setCombinedTabs(combinedTabs.filter(t => t !== 'api'))}>
                                Close
                              </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                              <ApiDocViewer 
                                apiDoc={documents.find(d => d.name === 'API_REFERENCE.md')?.content || ''} 
                                onDownload={downloadAllDocuments}
                              />
                            </div>
                          </div>
                        </ResizablePanel>
                      )}
                    </ResizablePanelGroup>
                  </div>
                )}
              </div>
            </Tabs>
          </div>
        )}
      </main>

      {/* Floating ChatBot */}
      <FloatingChatBot />

      {/* Footer */}
      {!hasStarted && (
        <footer className="border-t border-border py-12">
          <div className="chat-container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center space-y-3 animate-fade-in group cursor-pointer">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[hsl(var(--lovable-purple)/0.2)] to-[hsl(var(--lovable-pink)/0.2)] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-accent/30">
                  <Sparkles className="w-8 h-8 text-accent group-hover:rotate-180 transition-transform duration-500" />
                </div>
                <h3 className="text-lg font-semibold group-hover:text-accent transition-colors duration-300">Smart Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  AI analyzes your code structure, dependencies, and patterns
                </p>
              </div>
              
              <div className="text-center space-y-3 animate-fade-in group cursor-pointer" style={{ animationDelay: '100ms' }}>
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[hsl(var(--lovable-purple)/0.2)] to-[hsl(var(--lovable-pink)/0.2)] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-accent/30">
                  <FileText className="w-8 h-8 text-accent group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-lg font-semibold group-hover:text-accent transition-colors duration-300">Live Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Watch documentation build in real-time with instant preview
                </p>
              </div>
              
              <div className="text-center space-y-3 animate-fade-in group cursor-pointer" style={{ animationDelay: '200ms' }}>
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[hsl(var(--lovable-purple)/0.2)] to-[hsl(var(--lovable-pink)/0.2)] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-accent/30">
                  <Code className="w-8 h-8 text-accent group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-lg font-semibold group-hover:text-accent transition-colors duration-300">Complete API Docs</h3>
                <p className="text-sm text-muted-foreground">
                  Generate comprehensive API docs with endpoints and examples
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Index;
