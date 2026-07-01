const CATEGORY_IN_USE_ERROR = "Cannot delete category that is in use";
const CATEGORY_ALREADY_EXISTS_ERROR = "Category already exists";
const CATEGORY_UNIQUE_CONSTRAINT_ERROR =
  "UNIQUE constraint failed: mst_categories.name";

export function isCategoryInUseError(error: unknown): boolean {
  return error instanceof Error && error.message === CATEGORY_IN_USE_ERROR;
}

export function isCategoryAlreadyExistsError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === CATEGORY_ALREADY_EXISTS_ERROR ||
      error.message.includes(CATEGORY_UNIQUE_CONSTRAINT_ERROR))
  );
}

export function isExpectedCategoryError(error: unknown): boolean {
  return isCategoryInUseError(error) || isCategoryAlreadyExistsError(error);
}

export function getSaveCategoryErrorMessage(error: unknown): string {
  if (isCategoryAlreadyExistsError(error)) {
    return "A category with this name already exists.";
  }

  return "Failed to save category. Please try again.";
}

export function getDeleteCategoryErrorMessage(error: unknown): string {
  if (isCategoryInUseError(error)) {
    return "This category is used by existing transactions or budgets. Move or delete those items before deleting the category.";
  }

  return "Failed to delete category. Please try again.";
}
