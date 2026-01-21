import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EditWeightDialogProps {
  currentWeight?: string | null;
}

export function EditWeightDialog({ currentWeight }: EditWeightDialogProps) {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState(currentWeight || "");
  const utils = trpc.useUtils();

  const updateWeight = trpc.user.updateWeight.useMutation({
    onSuccess: () => {
      toast.success("Peso atualizado com sucesso!");
      utils.auth.me.invalidate();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar peso: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error("Por favor, insira um peso válido");
      return;
    }
    updateWeight.mutate({ weight: weightNum });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Atualizar Peso</DialogTitle>
            <DialogDescription>
              Atualize seu peso corporal atual em kg.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Peso (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="col-span-3"
                placeholder="83.0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateWeight.isPending}>
              {updateWeight.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
