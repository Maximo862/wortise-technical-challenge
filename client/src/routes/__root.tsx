import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createRootRoute,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { authClient } from "../lib/auth-client";
import { articleQueryKeys } from "../features/articles/api/article-query-keys";

function RootLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session, isPending } = authClient.useSession();

  return (
    <>
      <nav className="flex items-center justify-between p-4 border-b">
        <Link to="/" className="font-semibold">
          Articles App
        </Link>
        <div className="flex items-center gap-4">
          {isPending ? null : session ? (
            <>
              <Link to="/articles">My articles</Link>
              <span className="hidden sm:inline">Hi, {session.user.name}</span>
              <Button
                onPress={async () => {
                  await authClient.signOut();
                  queryClient.removeQueries({
                    queryKey: articleQueryKeys.mine(),
                  });
                  navigate({ to: "/" });
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>
      <Outlet />
    </>
  );
}

export const Route = createRootRoute({ component: RootLayout });