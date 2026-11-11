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

describe("жаңа ойын түрлері", () => {
  const q = (id: string, data: unknown, answer: unknown) => ({ id, prompt: "", data, answer, points: 1 });
  it("Ретімен қой: тек толық дұрыс рет ұпай береді", () => {
    const x = q("o", { items: ["a", "b", "c"] }, [0, 1, 2]);
    expect(scoreQuestion("ORDERING", x, [0, 1, 2]).score).toBe(1);
    expect(scoreQuestion("ORDERING", x, [1, 0, 2]).score).toBe(0);
  });
  it("Жұбын тап: әр 3 қате 1 балл кемітеді", () => {
    const x = q("m", { left: Array(10).fill("l"), right: Array(10).fill("r") }, []);
    expect(scoreQuestion("MEMORY", x, { found: 10, mistakes: 2 })).toMatchObject({ score: 10, max: 10 });
    expect(scoreQuestion("MEMORY", x, { found: 10, mistakes: 7 }).score).toBe(8);
    expect(scoreQuestion("MEMORY", x, { found: 99, mistakes: -5 }).score).toBe(10);
  });
  it("Шыңға шық: бірінші қатеден кейін ұпай жоқ", () => {
    const qs = [q("1", { options: ["a", "b"] }, 0), q("2", { options: ["a", "b"] }, 0), q("3", { options: ["a", "b"] }, 0)];
    expect(scoreGame("CLIMB", qs, { 1: 0, 2: 1, 3: 0 }).score).toBe(1);
    expect(scoreGame("CLIMB", qs, { 1: 0, 2: 0, 3: 0 }).score).toBe(3);
  });
});
