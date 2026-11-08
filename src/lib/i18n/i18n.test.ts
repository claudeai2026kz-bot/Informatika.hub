import { describe, expect, it } from "vitest";
import { translate } from ".";
import ru from "./ru";
import en from "./en";

describe("i18n", () => {
  it("қазақша мәтінді өзгертпейді", () => {
    expect(translate("kk", "Материалдар")).toBe("Материалдар");
    expect(translate("kk", "{g}-сынып", { g: 7 })).toBe("7-сынып");
  });
  it("орысша және ағылшынша аударады", () => {
    expect(translate("ru", "Материалдар")).toBe("Материалы");
    expect(translate("en", "Түнгі режим")).toBe("Night mode");
  });
  it("айнымалыларды қояды", () => {
    expect(translate("ru", "{g}-сынып", { g: 9 })).toBe("9 класс");
    expect(translate("en", "{n} сұрақ", { n: 5 })).toBe("5 questions");
  });
  it("сан бар мәтінді үлгі арқылы табады", () => {
    expect(translate("en", "7-сынып")).toBe("Grade 7");
  });
  it("аудармасы жоқ мәтін (материал атауы) өзгермейді", () => {
    expect(translate("ru", "Python программалау негіздері")).toBe("Python программалау негіздері");
  });
  it("екі сөздіктің кілттері бірдей", () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort());
  });
});
