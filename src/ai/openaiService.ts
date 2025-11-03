import * as vscode from 'vscode';

// Simplifier pour éviter les erreurs fetch
export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateCompletion(prompt: string): Promise<string> {
    try {
      // Use dynamic import for fetch compatibility
      const fetch = (await import('node-fetch')).default;

      const response = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo-instruct',
          prompt: prompt,
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      const data = (await response.json()) as any;
      return data.choices[0]?.text || 'No response generated';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return 'Error generating response';
    }
  }

  // Simplifier les prompts sans dépendance externe
  generateVincianPrompt(principle: string, codeContext: string, languageId: string): string {
    const promptMap: Record<string, string> = {
      curiosita: 'Analyze this code with curiosity and suggest improvements',
      dimostrazione: 'Demonstrate how this code could be optimized',
      sensazione: 'Apply sensory principles to enhance this code',
      sfumato: 'Apply subtle gradations and transitions to this code',
      arte_scienza: 'Balance art and science in this code structure',
      corporalita: 'Apply physical movement principles to this code',
      connessione: 'Find connections and patterns in this code',
    };

    const principlePrompt = promptMap[principle] || 'Analyze this code with Da Vinci principles';
    return `${principlePrompt}\n\nCode:\n\`\`\`${languageId}\n${codeContext}\n\`\`\``;
  }
}
