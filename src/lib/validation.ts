import { z } from "zod";

export const emailSchema = z
  .string({ required_error: "Email енгізіңіз" })
  .trim()
  .toLowerCase()
  .min(1, "Email енгізіңіз")
  .max(160, "Email тым ұзын")
  .email("Email форматы дұрыс емес");

/** Кемінде 8 таңба, бір әріп және бір сан. */
export const passwordSchema = z
  .string({ required_error: "Құпиясөз енгізіңіз" })
  .min(8, "Құпиясөз кемінде 8 таңбадан тұруы керек")
  .max(100, "Құпиясөз тым ұзын")
  .regex(/[A-Za-zА-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһЁё]/, "Құпиясөзде кемінде бір әріп болуы керек")
  .regex(/\d/, "Құпиясөзде кемінде бір сан болуы керек");

export const nameSchema = z
  .string({ required_error: "Аты-жөніңізді енгізіңіз" })
  .trim()
  .min(2, "Аты-жөні кемінде 2 таңба болуы керек")
  .max(80, "Аты-жөні тым ұзын");

export const registerSchema = z
  .object({ name: nameSchema, email: emailSchema, password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Құпиясөздер сәйкес келмейді" });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Құпиясөз енгізіңіз"),
});

export type FieldErrors = Record<string, string>;
export function fieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "form");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
