import { Button } from "@heroui/react";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { authClient } from "../lib/auth-client";

function RootLayout() {
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
              <span>Hi, {session.user.name}</span>
              <Button onPress={() => authClient.signOut()}>Log out</Button>
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