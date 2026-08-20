"use client";

import { TesterToolsPanel } from "@/components/profile/tester-tools-panel";
import { CollegeVerificationPanel } from "@/components/profile/college-verification-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminToolsShell() {
  return (
    <Tabs defaultValue="tools" className="w-full" aria-label="Admin tools">
      <TabsList className="mb-3 w-full max-w-xs">
        <TabsTrigger value="tools" className="flex-1">
          Tools
        </TabsTrigger>
        <TabsTrigger value="college" className="flex-1">
          College
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tools">
        <TesterToolsPanel />
      </TabsContent>
      <TabsContent value="college">
        <CollegeVerificationPanel />
      </TabsContent>
    </Tabs>
  );
}
