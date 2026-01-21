import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExerciseGifModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  gifUrl: string;
}

export function ExerciseGifModal({ open, onOpenChange, exerciseName, gifUrl }: ExerciseGifModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{exerciseName}</DialogTitle>
          <DialogDescription>
            Demonstração da execução correta do exercício
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center bg-muted rounded-lg p-4">
          <img
            src={gifUrl}
            alt={`Demonstração: ${exerciseName}`}
            className="max-w-full h-auto rounded-lg"
            loading="lazy"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
