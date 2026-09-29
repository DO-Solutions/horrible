"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export function PreviewPane({ html }: { html: string | null }) {
  return (
    <Tabs defaultValue="preview" className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-2">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="preview" className="min-h-0 flex-1 p-4">
        {html ? (
          <iframe
            title="Generated site preview"
            srcDoc={html}
            sandbox="allow-scripts"
            className="size-full rounded-lg border border-border bg-white"
          />
        ) : (
          <div className="flex size-full flex-col gap-3 rounded-lg border border-border p-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-1/3" />
          </div>
        )}
      </TabsContent>

      <TabsContent value="code" className="min-h-0 flex-1 overflow-auto p-4">
        <pre className="h-full overflow-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs text-muted-foreground">
          {html ?? "// Nothing built yet."}
        </pre>
      </TabsContent>
    </Tabs>
  );
}
