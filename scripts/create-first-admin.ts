import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

try { process.loadEnvFile?.(".env.local"); } catch { /* variáveis podem vir do ambiente */ }

const args = Object.fromEntries(process.argv.slice(2).map((arg) => { const [key, ...rest] = arg.replace(/^--/, "").split("="); return [key, rest.join("=")]; }));
const schema = z.object({ email: z.string().email(), name: z.string().min(2).max(160), password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/) });
const parsed = schema.safeParse({ email: args.email, name: args.name, password: args.password });
if (!parsed.success) {
  console.error("Uso: npm run admin:create -- --email=admin@dominio.com --name=Nome --password='SenhaForte#123'");
  console.error("A senha deve ter 12+ caracteres, maiúscula, minúscula, número e símbolo.");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local."); process.exit(1); }
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const email = parsed.data.email.toLowerCase();
const { data, error } = await admin.auth.admin.createUser({ email, password: parsed.data.password, email_confirm: true, user_metadata: { nome: parsed.data.name, perfil: "administrator" } });
if (error || !data.user) { console.error(`Não foi possível criar o usuário: ${error?.message ?? "erro desconhecido"}`); process.exit(1); }
const { error: profileError } = await admin.from("profiles").insert({ user_id: data.user.id, nome: parsed.data.name, email, perfil: "administrator", ativo: true });
if (profileError) { await admin.auth.admin.deleteUser(data.user.id); console.error(`Usuário revertido porque o perfil não pôde ser criado: ${profileError.message}`); process.exit(1); }
console.log(`Administrador criado com sucesso: ${email}`);
console.log("A senha não foi exibida nem gravada pelo script.");
