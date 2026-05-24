/** Comptes de démonstration (dev uniquement — voir README). */
export const DEMO_ACCOUNTS = [
  {
    label: "Voyageur",
    email: "client@test.com",
    password: "client123",
    loginPath: "/login",
  },
  {
    label: "Agence",
    email: "agency@test.com",
    password: "agency123",
    loginPath: "/agency/login",
  },
  {
    label: "Administrateur",
    email: "admin@maghrebvoyage.com",
    password: "admin123",
    loginPath: "/admin/login",
  },
] as const;
