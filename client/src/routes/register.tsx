import { Button, FieldError, Input, Label, TextField } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { registerSchema } from "shared";
import { authClient } from "../lib/auth-client";
import { useState } from "react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    validators: { onChange: registerSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);
      const { error } = await authClient.signUp.email(value);
      if (error) {
        setFormError(error.message ?? "Could not create the account.");
        return;
      }
      navigate({ to: "/" });
    },
  });

  return (
    <main className="p-4 max-w-sm mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Register</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <TextField
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              isInvalid={
                field.state.meta.isTouched && field.state.meta.errors.length > 0
              }
            >
              <Label>Name</Label>
              <Input />
              <FieldError>
                {field.state.meta.isTouched
                  ? field.state.meta.errors[0]?.message
                  : undefined}
              </FieldError>
            </TextField>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <TextField
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
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

        {formError && <p className="text-red-600 text-sm">{formError}</p>}

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              className="self-end"
              type="submit"
              isDisabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </main>
  );
}
