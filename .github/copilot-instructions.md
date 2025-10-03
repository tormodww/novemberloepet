# GitHub Copilot Instructions

## General Guidelines
- Use **TypeScript** with strict typing enabled. Avoid `any` unless absolutely necessary.
- Follow **React best practices** with functional components and hooks.
- Ensure code is clean, readable, and self-explanatory.
- Prefer modern ESNext syntax (arrow functions, async/await, optional chaining).
- Ensure accessibility (a11y) in UI components (semantic HTML, ARIA attributes when relevant).

## React + TypeScript Rules
- Use `React.FC<Props>` or explicit `({prop}: Props): JSX.Element` for components.
- Always define `Props` and `State` interfaces/types explicitly.
- Avoid inline styles; use CSS modules, styled-components, or Tailwind classes.
- When creating components, always type props and avoid `any`.

## API & State Management
- Use `fetch` or `axios` for API calls, always strongly type request/response data.
- For global state, prefer React Context or Zustand (if introduced).
- Keep side effects inside `useEffect` hooks with proper dependency arrays.

## Testing
- Write unit tests with **Jest + React Testing Library**.
- Prefer `screen.getByRole` or `screen.findByRole` over `getByTestId` when possible.

## Example Patterns
```tsx
// Props definition
type ButtonProps = {
  label: string;
  onClick: () => void;
};

// Functional component
const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
    >
      {label}
    </button>
  );
};

export default Button;


# Sjekk alltid readme filen for bugs eller TODOs og spør meg om du skal gjøre noe med dem.
## Husk å skrive gode commit meldinger som beskriver hva du har gjort og hvorfor.
