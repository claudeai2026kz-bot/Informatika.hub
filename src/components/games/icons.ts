import { Gamepad2, Puzzle, Grid3x3, Zap, Brain, Code2, CircleCheckBig, Mountain, ListOrdered, Layers } from "lucide-react";
export const GAME_ICONS: Record<string, typeof Gamepad2> = {
  QUIZ: Gamepad2, MATCHING: Puzzle, CROSSWORD: Grid3x3, RAPID: Zap, LOGIC: Brain, CODING: Code2,
  TRUEFALSE: CircleCheckBig, CLIMB: Mountain, ORDERING: ListOrdered, MEMORY: Layers,
};
