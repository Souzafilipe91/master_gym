export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Redireciona para o backend que inicia o fluxo OAuth com o Google
export const getLoginUrl = () => {
  return `${window.location.origin}/api/auth/google`;
};
