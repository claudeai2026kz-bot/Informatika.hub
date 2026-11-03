import { describe, expect, it } from "vitest";
import { parseQuery } from "./assistant-parse";

describe("parseQuery", () => {
  it("мысал сұранысты түсінеді", () => {
    const p = parseQuery("Робот, маған 7-сыныптың II тоқсанындағы Python презентациясын тауып берші");
    expect(p.grade).toBe(7);
    expect(p.quarter).toBe(2);
    expect(p.typeKey).toBe("PRESENTATION");
    expect(p.terms).toContain("python");
  });
  it("сан түріндегі тоқсан", () => {
    const p = parseQuery("9 сынып 3-тоқсан html бейнесабақ");
    expect(p).toMatchObject({ grade: 9, quarter: 3, typeKey: "VIDEO" });
    expect(p.terms).toContain("html");
  });
  it("БЖБ бөлімін анықтайды", () => {
    expect(parseQuery("10-сынып бжб").section).toBe("assessments");
    expect(parseQuery("10-сынып бжб").assessmentKind).toBe("BZHB");
  });
  it("ойын", () => expect(parseQuery("5 сыныпқа ойын керек").section).toBe("games"));
  it("навигация", () => expect(parseQuery("таңдаулыларымды аш").nav?.href).toBe("/favorites"));
  it("көмек", () => expect(parseQuery("сайтты қалай қолданамын?").help).toBe(true));
  it("11-сынып", () => expect(parseQuery("11-сынып ҚМЖ").grade).toBe(11));
});
