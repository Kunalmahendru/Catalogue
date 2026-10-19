// Admins sign in with a short ID ("admin"). Supabase wants an email, so an ID is mapped to a made-up address that
// can never receive mail. Typing a full email still works.
const ID_DOMAIN = "nailsbyroops.admin";

export const toEmail = (id) => {
  const v = id.trim();
  return v.includes("@") ? v : `${v.toLowerCase()}@${ID_DOMAIN}`;
};

export const toId = (email = "") => email.replace(new RegExp(`@${ID_DOMAIN.replace(".", "\\.")}$`), "");
