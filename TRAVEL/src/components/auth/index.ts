// Composants de protection
export { AuthGuard } from "./AuthGuard";
export {
  RoleGate,
  ClientOnly,
  AgencyOnly,
  AdminOnly,
  GuestOnly,
  AuthenticatedOnly,
} from "./RoleGate";
export { UnauthorizedPage } from "./UnauthorizedPage";

// Composants de formulaires (existants)
export { DemoAccountsBox } from "./DemoAccountsBox";
export { GoogleSignInButton } from "./GoogleSignInButton";
