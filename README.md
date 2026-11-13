# TobiasfitnessWebsite

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Recipe categories

Administrators select Morgenmad, Frokost, Aftensmad, or Snack when creating or editing a recipe. Existing recipes without a category remain available under "Ikke kategoriseret" until an administrator assigns one. The recipe overview continues to show shared and personally assigned recipes separately.

The recipe category is stored by the Firebase storage functions, so deploy the updated functions along with the frontend when releasing this change.

## Training Reps/Tid migration

The administrator Reps/Tid fields accept numeric values (including decimal comma or point).
Existing free-text values can be migrated to their first number in both training programs and
exercise-library templates. Values without a number are left unchanged and reported for manual
review. Migration does not convert time units; for example, `10 min` becomes `10`.

The migration requires application default credentials with Firestore read/write access. Pause
exercise and program editing, deploy the updated application, and first run a read-only preview:

```powershell
node functions\scripts\migrate-reps.cjs --project PROJECT_ID
```

After reviewing the counts and verifying a Firestore backup, apply the migration with a new,
private backup file path outside the repository:

```powershell
node functions\scripts\migrate-reps.cjs --project PROJECT_ID --apply --backup C:\private\reps-backup.json
```

The backup records original and replacement values before any writes. The migration fails if a
document changes between the read and write; if interrupted, review the output and backup, then
rerun with a new backup file. The migration is safe to rerun on already converted values.

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
