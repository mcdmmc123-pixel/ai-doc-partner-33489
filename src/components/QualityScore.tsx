import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface QualityScoreProps {
  score: number;
}

export const QualityScore = ({ score }: QualityScoreProps) => {
  const getScoreLevel = () => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-500', icon: CheckCircle };
    if (score >= 60) return { label: 'Good', color: 'text-blue-500', icon: Circle };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-500', icon: AlertCircle };
    return { label: 'Needs Work', color: 'text-orange-500', icon: AlertCircle };
  };

  const level = getScoreLevel();
  const Icon = level.icon;

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Documentation Quality</h3>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${level.color}`} />
          <span className={`text-sm font-medium ${level.color}`}>{level.label}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <Progress value={score} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Score</span>
          <span className="font-medium text-foreground">{score}/100</span>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {score < 40 && 'Keep answering questions to improve quality'}
        {score >= 40 && score < 60 && 'Good progress! Add more details'}
        {score >= 60 && score < 80 && 'Almost there! Include examples'}
        {score >= 80 && 'Excellent documentation quality!'}
      </div>
    </div>
  );
};
