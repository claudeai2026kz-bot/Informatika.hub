import { describe, expect, it } from "vitest";
import { NEW_GAMES } from "../../prisma/games-new";
import { isLevel, mazeHasPath, runMaze, mazeSolved, type MazeLevel } from "./maze";
import { encode, cipherCheck } from "./cipher";
import { scoreQuestion } from "./games";

describe("жаңа ойындар", () => {
  it("барлық лабиринттің шешімі бар", () => {
    for (const g of NEW_GAMES.filter((x) => x.type === "MAZE"))
      for (const q of g.questions!) { expect(isLevel(q.data)).toBe(true); expect(mazeHasPath(q.data as MazeLevel)).toBe(true); }
  });
  it("лимитті деңгейлер қайталаумен шешіледі", () => {
    const L = NEW_GAMES.find((x) => x.type === "MAZE")!.questions!;
    expect(mazeSolved(L[4].data, [{ n: 7, body: ["F"] }])).toBe(true);
    expect(mazeSolved(L[5].data, [{ n: 5, body: ["F", "L", "F", "R"] }])).toBe(true);
    expect(mazeSolved(L[6].data, [{ n: 3, body: ["F", "F", "F", "R"] }])).toBe(true);
    expect(mazeSolved(L[7].data, [{ n: 2, body: ["F", "F", "L", "F", "F", "R"] }])).toBe(true);
    expect(mazeSolved(L[8].data, [{ n: 6, body: ["F", "R", "F", "L"] }])).toBe(true);
    expect(mazeSolved(L[4].data, ["F", "F", "F", "F", "F", "F", "F"])).toBe(false); // лимиттен асады
  });
  it("робот қабырғаға соғылады", () => {
    const L = NEW_GAMES.find((x) => x.type === "MAZE")!.questions![0].data as MazeLevel;
    expect(runMaze(L, ["F", "F", "F", "F", "F"]).reached).toBe(true);
    expect(runMaze(L, ["L", "F", "F", "F"]).crashed).toBe(true);
  });
  it("пиксель жолдары бірдей ұзындықта", () => {
    for (const g of NEW_GAMES.filter((x) => x.type === "PIXEL")) {
      const rows = g.questions![0].answer as string[];
      expect(rows.every((r) => /^[01]{10}$/.test(r))).toBe(true);
    }
  });
  it("шифрлар", () => {
    expect(encode("КОД", "caesar", 3)).toBe("МРЖ");
    expect(encode("ЖАД", "number", 3)).toBe("10 1 7");
    expect(cipherCheck("КОД", "caesar", 3, { enc: "мрж", dec: "код" })).toEqual({ encOk: true, decOk: true });
    expect(cipherCheck("ЖАД", "number", 3, { enc: "10, 1, 7", dec: "жад" }).encOk).toBe(true);
    const q = { id: "x", prompt: "", data: { cipher: "caesar", shift: 3 }, answer: "КОД", points: 2 };
    expect(scoreQuestion("CIPHER", q, { enc: "МРЖ", dec: "КОД" }).score).toBe(2);
    expect(scoreQuestion("CIPHER", q, { enc: "ААА", dec: "КОД" }).score).toBe(1);
  });
  it("пиксель ұпайы жол бойынша", () => {
    const q = { id: "p", prompt: "", data: {}, answer: ["101", "010", "111"], points: 1 };
    expect(scoreQuestion("PIXEL", q, ["101", "000", "111"])).toMatchObject({ score: 2, max: 3 });
  });
  it("қашу бөлмесі: мәтін де, нұсқа да", () => {
    expect(scoreQuestion("ESCAPE", { id: "e", prompt: "", data: {}, answer: ["бит", "bit"], points: 1 }, " Бит ").correct).toBe(true);
    expect(scoreQuestion("ESCAPE", { id: "e", prompt: "", data: { options: ["a", "b"] }, answer: 1, points: 1 }, 1).correct).toBe(true);
  });
});
