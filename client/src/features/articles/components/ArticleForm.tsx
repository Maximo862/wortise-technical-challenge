import {
  Button,
  FieldError,
  Input,
  Label,
  TextArea,
  TextField,
} from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { createArticleSchema, type CreateArticleInput } from "shared";

type ArticleFormProps = {
  initialValues?: CreateArticleInput;
  submitLabel: string;
  submittingLabel: string;
  onCancel: () => void;
  onSubmit: (values: CreateArticleInput) => Promise<unknown>;
};

const emptyValues: CreateArticleInput = {
  title: "",
  content: "",
  coverImageUrl: "",
};

export function ArticleForm({
  initialValues = emptyValues,
  submitLabel,
  submittingLabel,
  onCancel,
  onSubmit,
}: ArticleFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: initialValues,
    validators: { onChange: createArticleSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        await onSubmit(value);
      } catch (error) {
        setFormError(
          error instanceof Error ? error.message : "Could not save the article.",
        );
      }
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name="title">
        {(field) => (
          <TextField
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            isInvalid={
              field.state.meta.isTouched && field.state.meta.errors.length > 0
            }
          >
            <Label>Title</Label>
            <Input />
            <FieldError>
              {field.state.meta.isTouched
                ? field.state.meta.errors[0]?.message
                : undefined}
            </FieldError>
          </TextField>
        )}
      </form.Field>

      <form.Field name="content">
        {(field) => (
          <TextField
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            isInvalid={
              field.state.meta.isTouched && field.state.meta.errors.length > 0
            }
          >
            <Label>Content</Label>
            <TextArea rows={10} />
            <FieldError>
              {field.state.meta.isTouched
                ? field.state.meta.errors[0]?.message
                : undefined}
            </FieldError>
          </TextField>
        )}
      </form.Field>

      <form.Field name="coverImageUrl">
        {(field) => (
          <TextField
            value={field.state.value ?? ""}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            isInvalid={
              field.state.meta.isTouched && field.state.meta.errors.length > 0
            }
          >
            <Label>Cover image URL (optional)</Label>
            <Input type="url" />
            <FieldError>
              {field.state.meta.isTouched
                ? field.state.meta.errors[0]?.message
                : undefined}
            </FieldError>
          </TextField>
        )}
      </form.Field>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" onPress={onCancel}>
          Cancel
        </Button>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" isDisabled={!canSubmit || isSubmitting}>
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
