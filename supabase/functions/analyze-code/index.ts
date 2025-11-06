import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, messages, persona, autoGenerate } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Analyze file structure
    const fileAnalysis = analyzeFiles(files);
    
    // Handle auto-generation mode
    if (autoGenerate) {
      const systemPrompt = buildAutoGeneratePrompt(persona, fileAnalysis, files);
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Analyze the code and generate a comprehensive README.md file.' }
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        throw new Error('AI Gateway request failed');
      }

      const data = await response.json();
      const generatedReadme = data.choices[0].message.content;
      
      // Extract project name from first file or use default
      const projectName = files[0]?.name.split('.')[0] || 'Your Project';
      
      return new Response(
        JSON.stringify({ 
          generatedReadme,
          extractedData: {
            projectName,
            description: 'Auto-generated from code analysis',
            features: generatedReadme,
          },
          qualityScore: 85,
          suggestions: generateSmartSuggestions(fileAnalysis)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Build system prompt based on persona for interview mode
    const systemPrompt = buildSystemPrompt(persona, fileAnalysis);
    
    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI Gateway request failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Calculate quality score based on conversation
    const qualityScore = calculateQualityScore(messages, aiResponse);

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        qualityScore,
        suggestions: generateSmartSuggestions(fileAnalysis)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-code function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function analyzeFiles(files: any[]) {
  const analysis = {
    languages: new Set<string>(),
    frameworks: new Set<string>(),
    hasPackageJson: false,
    hasRequirementsTxt: false,
    hasPomXml: false,
    hasDockerfile: false,
    totalFiles: files.length,
    codeFiles: 0,
    configFiles: 0,
    totalLines: 0,
    classes: [] as string[],
    functions: [] as string[],
    imports: [] as string[],
    complexity: 0,
  };

  files.forEach(file => {
    const name = file.name.toLowerCase();
    const content = file.content || '';
    
    // Count lines
    const lines = content.split('\n');
    analysis.totalLines += lines.length;
    
    // Detect languages
    if (name.endsWith('.py')) {
      analysis.languages.add('Python');
      analyzeCodeStructure(content, 'python', analysis);
    }
    if (name.endsWith('.js') || name.endsWith('.jsx')) {
      analysis.languages.add('JavaScript');
      analyzeCodeStructure(content, 'javascript', analysis);
    }
    if (name.endsWith('.ts') || name.endsWith('.tsx')) {
      analysis.languages.add('TypeScript');
      analyzeCodeStructure(content, 'typescript', analysis);
    }
    if (name.endsWith('.java')) {
      analysis.languages.add('Java');
      analyzeCodeStructure(content, 'java', analysis);
    }
    if (name.endsWith('.go')) {
      analysis.languages.add('Go');
      analyzeCodeStructure(content, 'go', analysis);
    }
    if (name.endsWith('.rs')) {
      analysis.languages.add('Rust');
      analyzeCodeStructure(content, 'rust', analysis);
    }
    
    // Detect frameworks/tools
    if (name === 'package.json') {
      analysis.hasPackageJson = true;
      analysis.frameworks.add('Node.js');
      detectJSFrameworks(content, analysis);
    }
    if (name === 'requirements.txt') {
      analysis.hasRequirementsTxt = true;
      detectPythonFrameworks(content, analysis);
    }
    if (name === 'pom.xml') {
      analysis.hasPomXml = true;
      analysis.frameworks.add('Maven');
    }
    if (name === 'dockerfile' || name.startsWith('docker')) {
      analysis.hasDockerfile = true;
      analysis.frameworks.add('Docker');
    }
    
    // Count file types
    if (['.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.go', '.rs'].some(ext => name.endsWith(ext))) {
      analysis.codeFiles++;
    }
    if (['.json', '.yml', '.yaml', '.toml', '.ini', '.env'].some(ext => name.endsWith(ext))) {
      analysis.configFiles++;
    }
  });

  return {
    ...analysis,
    languages: Array.from(analysis.languages),
    frameworks: Array.from(analysis.frameworks),
  };
}

function analyzeCodeStructure(content: string, language: string, analysis: any) {
  const lines = content.split('\n');
  
  // Line-by-line analysis
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Calculate complexity (rough estimate)
    if (trimmed.includes('if ') || trimmed.includes('for ') || trimmed.includes('while ') || 
        trimmed.includes('switch ') || trimmed.includes('case ')) {
      analysis.complexity++;
    }
    
    // Detect structures based on language
    if (language === 'python') {
      // Python classes
      const classMatch = trimmed.match(/^class\s+(\w+)/);
      if (classMatch) analysis.classes.push(classMatch[1]);
      
      // Python functions
      const funcMatch = trimmed.match(/^def\s+(\w+)/);
      if (funcMatch) analysis.functions.push(funcMatch[1]);
      
      // Python imports
      const importMatch = trimmed.match(/^(?:from\s+[\w.]+\s+)?import\s+([\w,\s]+)/);
      if (importMatch) analysis.imports.push(importMatch[1].split(',')[0].trim());
    } else if (language === 'javascript' || language === 'typescript') {
      // JS/TS classes
      const classMatch = trimmed.match(/^(?:export\s+)?class\s+(\w+)/);
      if (classMatch) analysis.classes.push(classMatch[1]);
      
      // JS/TS functions
      const funcMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
      const arrowMatch = trimmed.match(/^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/);
      if (funcMatch) analysis.functions.push(funcMatch[1]);
      if (arrowMatch) analysis.functions.push(arrowMatch[1]);
      
      // JS/TS imports
      const importMatch = trimmed.match(/^import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) analysis.imports.push(importMatch[1]);
    } else if (language === 'java') {
      // Java classes
      const classMatch = trimmed.match(/^(?:public\s+)?class\s+(\w+)/);
      if (classMatch) analysis.classes.push(classMatch[1]);
      
      // Java methods
      const methodMatch = trimmed.match(/^(?:public|private|protected)\s+(?:static\s+)?(?:\w+\s+)?(\w+)\s*\(/);
      if (methodMatch) analysis.functions.push(methodMatch[1]);
      
      // Java imports
      const importMatch = trimmed.match(/^import\s+([\w.]+);/);
      if (importMatch) analysis.imports.push(importMatch[1]);
    }
  });
}

function detectJSFrameworks(content: string, analysis: any) {
  try {
    const pkg = JSON.parse(content);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    if (deps.react) analysis.frameworks.add('React');
    if (deps.vue) analysis.frameworks.add('Vue');
    if (deps.angular || deps['@angular/core']) analysis.frameworks.add('Angular');
    if (deps.next) analysis.frameworks.add('Next.js');
    if (deps.express) analysis.frameworks.add('Express');
    if (deps.nestjs || deps['@nestjs/core']) analysis.frameworks.add('NestJS');
  } catch (e) {
    // Invalid JSON, skip
  }
}

function detectPythonFrameworks(content: string, analysis: any) {
  const lines = content.toLowerCase().split('\n');
  lines.forEach(line => {
    if (line.includes('flask')) analysis.frameworks.add('Flask');
    if (line.includes('django')) analysis.frameworks.add('Django');
    if (line.includes('fastapi')) analysis.frameworks.add('FastAPI');
    if (line.includes('pytorch')) analysis.frameworks.add('PyTorch');
    if (line.includes('tensorflow')) analysis.frameworks.add('TensorFlow');
  });
}

function buildSystemPrompt(persona: string, fileAnalysis: any): string {
  const baseContext = `You are NarratO, an AI documentation assistant. You've analyzed a project with:
- ${fileAnalysis.totalFiles} files (${fileAnalysis.codeFiles} code files, ${fileAnalysis.configFiles} config files)
- ${fileAnalysis.totalLines} total lines of code
- Languages: ${fileAnalysis.languages.join(', ') || 'Unknown'}
- Frameworks/Tools: ${fileAnalysis.frameworks.join(', ') || 'Not detected'}
- Code complexity score: ${fileAnalysis.complexity}
- Detected ${fileAnalysis.classes.length} classes, ${fileAnalysis.functions.length} functions
- Found ${fileAnalysis.imports.length} import statements

Your role is to interview the developer to create professional documentation. Be concise and direct - ask one clear question at a time without lengthy explanations.`;

  const personaPrompts = {
    student: `${baseContext}

This is a STUDENT PROJECT. Focus on:
- Clear learning objectives and what was learned
- Step-by-step setup instructions for peers
- Challenges faced and how they were solved
- Simple, educational tone
- Include installation commands and dependencies clearly`,

    opensource: `${baseContext}

This is an OPEN SOURCE PROJECT. Focus on:
- Contribution guidelines and community aspects
- Clear API documentation and usage examples
- Installation across different platforms
- License and attribution information
- Professional, welcoming tone for contributors`,

    hackathon: `${baseContext}

This is a HACKATHON PROJECT. Focus on:
- The problem being solved and innovation
- Quick start guide for judges
- Live demo link and screenshots
- Technology choices and why
- Impact and future potential
- Exciting, energetic tone`,

    professional: `${baseContext}

This is a PROFESSIONAL PROJECT. Focus on:
- Business value and use cases
- Architecture and design decisions
- Security and scalability considerations
- Deployment and maintenance procedures
- Formal, technical tone
- API documentation and integration guides`,
  };

  return personaPrompts[persona as keyof typeof personaPrompts] || personaPrompts.professional;
}

function buildAutoGeneratePrompt(persona: string, fileAnalysis: any, files: any[]): string {
  const codeSnippets = files.slice(0, 5).map(f => 
    `File: ${f.name}\n${f.content.substring(0, 500)}...`
  ).join('\n\n');
  
  const baseContext = `You are NarratO, an AI documentation generator. Analyze this project and create a complete README.md:

PROJECT ANALYSIS:
- ${fileAnalysis.totalFiles} files (${fileAnalysis.codeFiles} code files)
- ${fileAnalysis.totalLines} total lines of code
- Languages: ${fileAnalysis.languages.join(', ') || 'Unknown'}
- Frameworks: ${fileAnalysis.frameworks.join(', ') || 'Not detected'}
- Complexity: ${fileAnalysis.complexity}
- Classes: ${fileAnalysis.classes.length}
- Functions: ${fileAnalysis.functions.length}

CODE SAMPLES:
${codeSnippets}

Generate a comprehensive, professional README.md with:
1. Project title and description (infer from files and code structure)
2. Key features list (analyze actual functionality from code)
3. Installation instructions (based on detected package managers and dependencies)
4. Usage examples (extract from actual code patterns)
5. Technology stack (list all detected languages and frameworks)
6. Configuration details (if config files are present)

Format it as a complete markdown document that accurately reflects the analyzed code.`;

  const personaStyles = {
    student: `${baseContext}\n\nSTYLE: Educational, clear for learning. Include learning objectives and step-by-step explanations.`,
    opensource: `${baseContext}\n\nSTYLE: Community-friendly, welcoming contributors. Include contribution guidelines and license info.`,
    hackathon: `${baseContext}\n\nSTYLE: Exciting, problem-focused. Highlight innovation, impact, and demo links.`,
    professional: `${baseContext}\n\nSTYLE: Formal, business-oriented. Focus on architecture, scalability, and enterprise features.`,
  };

  return personaStyles[persona as keyof typeof personaStyles] || personaStyles.professional;
}

function calculateQualityScore(messages: any[], latestResponse: string): number {
  let score = 0;
  
  // Base score for having a conversation
  score += Math.min(messages.length * 10, 30);
  
  // Check for key documentation elements in responses
  const keywords = [
    'installation', 'setup', 'usage', 'features', 'dependencies',
    'requirements', 'api', 'configuration', 'examples', 'contributing'
  ];
  
  const allContent = messages.map(m => m.content.toLowerCase()).join(' ');
  keywords.forEach(keyword => {
    if (allContent.includes(keyword)) score += 5;
  });
  
  // Response quality factors
  if (latestResponse.length > 100) score += 10;
  if (latestResponse.includes('```')) score += 5; // Has code examples
  
  return Math.min(score, 100);
}

function generateSmartSuggestions(fileAnalysis: any): string[] {
  const suggestions = [];
  
  if (!fileAnalysis.hasPackageJson && fileAnalysis.languages.includes('JavaScript')) {
    suggestions.push('Add package.json with dependencies');
  }
  
  if (!fileAnalysis.hasRequirementsTxt && fileAnalysis.languages.includes('Python')) {
    suggestions.push('Add requirements.txt file');
  }
  
  if (!fileAnalysis.hasDockerfile && fileAnalysis.codeFiles > 5) {
    suggestions.push('Consider adding Dockerfile for easy deployment');
  }
  
  suggestions.push('Add .gitignore file');
  suggestions.push('Add LICENSE file');
  suggestions.push('Add CONTRIBUTING.md for collaborators');
  
  return suggestions;
}
