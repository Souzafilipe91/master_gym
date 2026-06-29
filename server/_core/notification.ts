import { TRPCError } from "@trpc/server";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  const title = input.title?.trim();
  const content = input.content?.trim();

  if (!title) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Título da notificação é obrigatório." });
  }
  if (!content) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Conteúdo da notificação é obrigatório." });
  }
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Título deve ter no máximo ${TITLE_MAX_LENGTH} caracteres.` });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Conteúdo deve ter no máximo ${CONTENT_MAX_LENGTH} caracteres.` });
  }

  return { title, content };
};

export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const { title, content } = validatePayload(payload);
  // Notificação logada no servidor — configure um serviço externo (email, webhook, etc.) se necessário
  console.log(`[Notificação] ${title}\n${content}`);
  return true;
}
