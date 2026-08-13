import { Button, FieldError, Input, Label, TextField } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { loginSchema } from "shared";
import { authClient } from "../lib/auth-client";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);
      const { error } = await authClient.signIn.email(value);
      if (error) {
        setFormError(error.message ?? "Invalid email or password.");
        return;
      }
      navigate({ to: "/" });
    },
  });

  return (
    <main className="p-4 max-w-sm mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Login</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => (
            <TextField
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              isRequired
              isInvalid={
                field.state.meta.isTouched && field.state.meta.errors.length > 0
              }
            >
              <Label>Email</Label>
              <Input type="email" />
              <FieldError>
                {field.state.meta.isTouched
                  ? field.state.meta.errors[0]?.message
                  : undefined}
              </FieldError>
            </TextField>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <TextField
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              isRequired
              isInvalid={
                field.state.meta.isTouched && field.state.meta.errors.length > 0
              }
            >
              <Label>Password</Label>
              <Input type="password" />
              <FieldError>
                {field.state.meta.isTouched
                  ? field.state.meta.errors[0]?.message
                  : undefined}
              </FieldError>
            </TextField>
          )}
        </form.Field>

        {formError && (
          <p className="text-red-600 text-sm" role="alert">
            {formError}
          </p>
        )}

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              className="self-end"
              type="submit"
              isDisabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </main>
  );
}
