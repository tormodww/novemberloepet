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
Testoppsettet i prosjektet bruker Vitest som testrunner og React Testing Library for å teste React-komponenter. Matcher-funksjoner fra jest-dom er tilgjengelig globalt via en setup-fil (src/setupTests.ts) som importeres i vitest.config.ts med setupFiles. Testene skrives med describe, it og expect fra Vitest, og bruker screen fra React Testing Library for å finne og verifisere elementer i DOM.
Oppsummering:
Testrunner: Vitest (med happy-dom som testmiljø).
Testbibliotek: React Testing Library.
Matcher-funksjoner: jest-dom, tilgjengelig globalt via setupTests.ts.
Konfigurasjon: vitest.config.ts med setupFiles og globals: true.
Teststruktur: describe/it/expect fra Vitest, screen fra React Testing Library.
Eksempel: Testfilene importerer kun nødvendige testfunksjoner og komponenter, og matcher-funksjoner som toBeInTheDocument er tilgjengelig uten ekstra import.
Dette oppsettet gir moderne, robust og lettforståelig testing av React-komponenter med god støtte for DOM-assertions og a11y.

# Refactoring & Code Structure Guidelines

## Component Structure
- Break down large components into **smaller, reusable components**.
- Keep each component **focused on a single responsibility** (SRP).
- Extract complex logic into **custom hooks** (`useSomething`) if reused across components.
- Place shared UI elements in a `/components/common` or `/shared` folder.

- Keep hooks in `hooks/`, utilities in `utils/`, and types in `types/`.

## Refactoring Practices
- Remove duplicated logic by extracting it into **helper functions** or **custom hooks**.
- Use **interfaces/types** in a shared `types.ts` to avoid duplication of type definitions.
- Refactor long functions into smaller, **pure functions** where each handles one thing.
- Replace inline anonymous functions with named handlers when readability improves.

## Code Quality
- Strive for **self-explanatory names** (avoid abbreviations).
- Keep functions short (ideally <30 lines).
- Use descriptive commit messages when performing refactors (`refactor: extract useForm hook`).
- Write tests for refactored logic to ensure nothing breaks.


# Sjekk alltid readme filen for bugs eller TODOs og spør meg om du skal gjøre noe med dem.
## Husk å skrive gode commit meldinger som beskriver hva du har gjort og hvorfor.
