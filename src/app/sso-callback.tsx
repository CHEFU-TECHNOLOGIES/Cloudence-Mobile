import { Redirect } from "expo-router";
import { useSession } from "../auth/SessionContext";
import CenteredPageSkeleton from "../components/cloudence/skeletons/CenteredPageSkeleton";

export default function SsoCallbackScreen() {
  const { isSigningIn, status } = useSession();

  if (isSigningIn || status === "loading") {
    return <CenteredPageSkeleton />;
  }

  return <Redirect href={status === "authenticated" ? "/" : "/sign-in"} />;
}
