"use client";

import { useState, type KeyboardEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLE_PROMPTS = [
  "Landing page for my artisanal sourdough bakery",
  "Portfolio for a serious corporate lawyer",
  "Wedding website for Sam & Priya",
];

interface HeroProps {
  onSubmit: (prompt: string) => void;
  submitting: boolean;
}

export function Hero({ onSubmit, submitting }: HeroProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    const value = prompt.trim();
    if (!value || submitting) return;
    onSubmit(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
            Powered by DigitalOcean Managed Agents
          </span>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">horrible</h1>
          <p className="text-lg text-muted-foreground">Build something you&apos;ll regret.</p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the website you deserve…"
            className="min-h-28 resize-none text-base"
            autoFocus
          />

          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <Badge
                key={example}
                variant="secondary"
                role="button"
                tabIndex={0}
                className="cursor-pointer px-3 py-1.5 transition-colors hover:bg-primary/15 hover:text-primary"
                onClick={() => setPrompt(example)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setPrompt(example);
                  }
                }}
              >
                {example}
              </Badge>
            ))}
          </div>

          <Button
            size="lg"
            className="mt-2 self-center px-8"
            onClick={handleSubmit}
            disabled={!prompt.trim() || submitting}
          >
            {submitting ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            Build it
          </Button>
        </div>
      </div>
    </div>
  );
}
