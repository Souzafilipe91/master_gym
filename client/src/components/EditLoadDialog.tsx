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
import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EditLoadDialogProps {
  exerciseName: string;
  currentLoad: string;
  onSave: (newLoad: number) => void;
}

export function EditLoadDialog({ exerciseName, currentLoad, onSave }: EditLoadDialogProps) {
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState(currentLoad);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const loadNum = parseFloat(load);
    if (isNaN(loadNum) || loadNum < 0) {
      toast.error("Por favor, insira uma carga válida");
      return;
    }
    onSave(loadNum);
    toast.success("Carga atualizada!");
    setOpen(false);
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
            <DialogTitle>Ajustar Carga</DialogTitle>
            <DialogDescription>
              Ajuste a carga para: {exerciseName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="load" className="text-right">
                Carga (kg)
              </Label>
              <Input
                id="load"
                type="number"
                step="0.5"
                value={load}
                onChange={(e) => setLoad(e.target.value)}
                className="col-span-3"
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
