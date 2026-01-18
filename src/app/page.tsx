"use client";

import Link from "next/link";
import { ArrowRight, HardDrive, GripVertical, Image, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHasProjects } from "@/lib/db/hooks";

const features = [
  {
    icon: HardDrive,
    title: "Local-first",
    description:
      "Your data stays on your device. No servers, no accounts, complete privacy.",
  },
  {
    icon: GripVertical,
    title: "Drag & Drop",
    description:
      "Intuitive task management with smooth drag and drop between columns.",
  },
  {
    icon: Image,
    title: "Image Support",
    description:
      "Attach images to tasks by uploading or pasting from clipboard.",
  },
  {
    icon: Sparkles,
    title: "KISS Philosophy",
    description:
      "Keep It Simple, Stupid. No bloat, no complexity, just what you need.",
  },
];

export default function Home() {
  const hasProjects = useHasProjects();

  return (
    <main className="min-h-screen">
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Simple task management,
          <br />
          <span className="text-muted-foreground">done right.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          A local-first kanban board that respects your privacy. No accounts, no
          servers, no complexity. Just you and your tasks.
        </p>
        <Link href="/projects">
          <Button className="text-base px-8 py-4">
            {hasProjects ? "View my projects" : "Get Started"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="transition-shadow duration-200 hover:shadow-lg">
              <CardHeader>
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mb-2">
                  <feature.icon className="w-5 h-5 text-foreground" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-border">
        <p className="text-center text-sm text-muted-foreground">
          Built with the KISS philosophy. Open source and privacy-first.
        </p>
      </footer>
    </main>
  );
}
