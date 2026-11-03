import { describe, expect, it } from "vitest";
import { scoreGame, scoreQuestion, publicQuestion, crosswordLayout } from "./games";

const q = (answer: unknown, points = 1, data: unknown = {}) => ({ id: "q", prompt: "", data, answer, points });

describe("ойын ұпайы", () => {
  it("тест: дұрыс индекс", () => {
    expect(scoreQuestion("QUIZ", q(2), 2).score).toBe(1);
    expect(scoreQuestion("QUIZ", q(2), 1).score).toBe(0);
    expect(scoreQuestion("QUIZ", q(2), "2").score).toBe(0);
  });
  it("сәйкестендіру: жартылай ұпай", () => {
    expect(scoreQuestion("MATCHING", q([0, 1, 2, 3], 4), [0, 1, 3, 2])).toMatchObject({ score: 2, max: 4, correct: false });
  });
  it("сөзжұмбақ: регистр мен бос орынды елемейді", () => {
    expect(scoreQuestion("CROSSWORD", q("КОМПЬЮТЕР"), " компьютер ").correct).toBe(true);
  });
  it("логика: бірнеше дұрыс жауап", () => {
    expect(scoreQuestion("LOGIC", q(["16", "он алты"]), "Он  алты").correct).toBe(true);
  });
  it("жалпы ұпай", () => {
    const qs = [{ id: "a", prompt: "", data: {}, answer: 0, points: 1 }, { id: "b", prompt: "", data: {}, answer: 1, points: 2 }];
    expect(scoreGame("QUIZ", qs, { a: 0, b: 1 })).toMatchObject({ score: 3, max: 3 });
    expect(scoreGame("QUIZ", qs, { a: 1 })).toMatchObject({ score: 0, max: 3 });
  });
  it("клиентке жауап жіберілмейді", () => {
    const p = publicQuestion("QUIZ", q(1, 1, { options: ["a", "b"] }), 1);
    expect(JSON.stringify(p)).not.toContain("answer");
  });
  it("сөзжұмбақ торы", () => {
    const l = crosswordLayout([{ id: "1", data: { row: 0, col: 0, dir: "across", len: 9 } }, { id: "2", data: { row: 0, col: 3, dir: "down", len: 7 } }]);
    expect(l).toMatchObject({ rows: 7, cols: 9 });
  });
});
