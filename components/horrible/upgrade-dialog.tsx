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
import { Sparkles } from "lucide-react";

export function UpgradeDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Sparkles className="text-accent" />
        Upgrade to Horrible Pro
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Horrible Pro</DialogTitle>
          <DialogDescription>
            Unlock even worse defaults: a fourth clashing font, auto-playing MIDI, and a cookie
            banner that never, ever closes.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          $49/mo, billed in regret. Cancel anytime - we won&apos;t stop you.
        </div>
        <DialogFooter>
          <Button variant="secondary" className="w-full" disabled>
            Coming never
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
