"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { TimetableShapeGroup } from "@/engine/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ShapeNavigatorProps {
  groups: TimetableShapeGroup[];
  activeShapeId: string;
  onSelect: (shapeId: string) => void;
}

export function ShapeNavigator({ groups, activeShapeId, onSelect }: ShapeNavigatorProps) {
  const activeIndex = groups.findIndex(g => g.shapeId === activeShapeId);
  const activeGroup = groups[activeIndex] ?? groups[0];

  if (groups.length <= 1) {
    return null;
  }

  const handlePrevious = () => {
    const prevIndex = Math.max(0, activeIndex - 1);
    onSelect(groups[prevIndex].shapeId);
  };

  const handleNext = () => {
    const nextIndex = Math.min(groups.length - 1, activeIndex + 1);
    onSelect(groups[nextIndex].shapeId);
  };

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur mb-2">
      <div className="flex flex-col gap-4">
        
        {/* Top Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-foreground">
              Shape {activeIndex >= 0 ? activeIndex + 1 : 1} of {groups.length}
            </h3>
            <Badge className="bg-primary/10 text-primary border border-primary/20 shadow-none hover:bg-primary/20">
              {activeGroup?.variantCount ?? 1} variants
            </Badge>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={activeIndex <= 0}
            className="w-36 bg-background"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous Shape
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={activeIndex >= groups.length - 1}
            className="w-36 bg-background"
          >
            Next Shape
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

      </div>
    </div>
  );
}
