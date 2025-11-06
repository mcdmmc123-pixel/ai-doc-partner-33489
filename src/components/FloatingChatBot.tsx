import { useState } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export const FloatingChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: 'Hi! I can help you navigate the app or answer any questions about documentation generation.',
    },
  ]);
  const [input, setInput] = useState('');

  const quickActions = [
    'How do I upload files?',
    'What file formats are supported?',
    'How to generate API docs?',
    'Explain code flow visualization',
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Simple bot responses
    setTimeout(() => {
      let botResponse = '';
      const lowerInput = input.toLowerCase();

      if (lowerInput.includes('upload') || lowerInput.includes('file')) {
        botResponse =
          'To upload files, click the file upload area on the home page. You can drag and drop multiple code files or click to browse. Supported formats include .js, .ts, .py, .java, and more.';
      } else if (lowerInput.includes('format')) {
        botResponse =
          'We support JavaScript, TypeScript, Python, Java, C++, Go, Rust, and many other programming languages. Just upload your source code files!';
      } else if (lowerInput.includes('api')) {
        botResponse =
          'To generate API documentation, upload your code files and click "Auto-Generate". The system will analyze your code and create comprehensive API reference docs automatically.';
      } else if (lowerInput.includes('flow') || lowerInput.includes('visuali')) {
        botResponse =
          'Code Flow Visualization shows the relationships between your files. It analyzes imports/exports and displays them as an interactive graph. You can switch between hierarchical and circular layouts.';
      } else if (lowerInput.includes('interview')) {
        botResponse =
          'Interview Mode asks you detailed questions about your project to generate more comprehensive documentation. It\'s great when you want to add context that isn\'t in the code.';
      } else {
        botResponse =
          'I can help with: uploading files, generating documentation, understanding the code flow visualization, and navigating the app. What would you like to know?';
      }

      setMessages((prev) => [...prev, { role: 'bot', content: botResponse }]);
    }, 500);

    setInput('');
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    handleSend();
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-gradient-to-br from-[hsl(var(--lovable-purple))] to-[hsl(var(--lovable-pink))] hover:shadow-[var(--glow-accent)] transition-all duration-300 hover:scale-110 animate-pulse-subtle"
          size="icon"
        >
          <Sparkles className="h-6 w-6 animate-spin-slow" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[500px] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-[hsl(var(--lovable-purple))] to-[hsl(var(--lovable-pink))] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">NarratO Assistant</h3>
                <p className="text-xs text-white/80">Always here to help</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-[hsl(var(--lovable-purple))] to-[hsl(var(--lovable-pink))] text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}

              {/* Quick Actions */}
              {messages.length === 1 && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs text-muted-foreground font-medium">Quick actions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(action)}
                        className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors border border-accent/20"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border bg-muted/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 rounded-full"
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-full bg-gradient-to-br from-[hsl(var(--lovable-purple))] to-[hsl(var(--lovable-pink))] hover:shadow-[var(--glow-accent)]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
