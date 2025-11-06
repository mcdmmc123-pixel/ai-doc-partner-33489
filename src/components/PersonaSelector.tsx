import { GraduationCap, Users, Zap, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PersonaSelectorProps {
  selectedPersona: string;
  onSelectPersona: (persona: string) => void;
}

const personas = [
  {
    id: 'student',
    label: 'Student Project',
    icon: GraduationCap,
    description: 'Educational focus with learning objectives',
    color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  },
  {
    id: 'opensource',
    label: 'Open Source',
    icon: Users,
    description: 'Community-focused with contribution guide',
    color: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  },
  {
    id: 'hackathon',
    label: 'Hackathon',
    icon: Zap,
    description: 'Problem-solving focus with impact',
    color: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
  },
  {
    id: 'professional',
    label: 'Professional',
    icon: Briefcase,
    description: 'Business value and technical depth',
    color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
  },
];

export const PersonaSelector = ({ selectedPersona, onSelectPersona }: PersonaSelectorProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Documentation Style</h3>
      <div className="grid grid-cols-2 gap-2">
        {personas.map((persona) => {
          const Icon = persona.icon;
          const isSelected = selectedPersona === persona.id;
          
          return (
            <Button
              key={persona.id}
              variant="outline"
              onClick={() => onSelectPersona(persona.id)}
              className={`h-auto flex flex-col items-start gap-2 p-3 ${
                isSelected ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <div className={`p-1.5 rounded ${persona.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-foreground">{persona.label}</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                {persona.description}
              </p>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
