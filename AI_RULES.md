# AI Development Rules & Tech Stack Guide

## Tech Stack Overview

• **Frontend Framework**: React 18 with TypeScript for component-based UI development
• **Routing**: React Router v6 for SPA navigation and route management
• **State Management**: React Context API with custom hooks for application state
• **UI Components**: shadcn/ui library built on Radix UI primitives with Tailwind CSS styling
• **Styling**: Tailwind CSS for utility-first responsive design system
• **Animations**: Framer Motion for smooth UI transitions and micro-interactions
• **HTTP Client**: Native fetch API with custom wrapper functions for API communication
• **Form Handling**: React Hook Form for validation and form state management
• **Icons**: Lucide React for consistent iconography throughout the application
• **Testing**: Vitest with React Testing Library for unit and integration tests

## AI Implementation Rules

### Agent Architecture
• **Conversational Agent**: Handle natural language understanding and dialogue flow using context-aware responses
• **Diagnostic Agent**: Execute system-level checks and network analysis through autonomous testing procedures
• **Analytics Agent**: Process feedback and usage patterns to optimize support workflows

### Code Structure Requirements
• All AI agents must be implemented as separate modules in `src/agents/` directory
• Agent communication must go through the MCP (Model Context Protocol) context system
• Never bypass the established context providers (`AuthContext`, `ChatContext`)
• Use existing utility functions in `src/lib/utils.ts` rather than implementing duplicates

### External Libraries Policy
• **Allowed**: Only use dependencies already present in package.json unless explicitly approved
• **Forbidden**: Do not add new npm packages without architecture review
• **Preferred**: Leverage existing shadcn/ui components instead of creating custom UI elements
• **Styling**: Use Tailwind CSS classes exclusively - no vanilla CSS except in `src/index.css`

### Data Handling Standards
• Always use TypeScript interfaces defined in `src/types/` for data structures
• Store transient state in React Context; persist only essential data via browser storage
• Never log sensitive customer information to console in production
• Validate all inputs using Zod schemas before processing

### Performance Guidelines
• Implement React.memo for components rendering lists or frequently updated data
• Use Suspense and code splitting for heavy components
• Limit API calls through debouncing and caching strategies
• Optimize animations to maintain 60fps using Framer Motion best practices

### Security Protocols
• Authenticate all agent actions through the existing AuthContext system
• Sanitize user inputs before displaying in UI or processing
• Never expose internal APIs or system commands directly to client-side code
• Implement proper error boundaries to prevent data leakage through error messages

### Testing Requirements
• Write unit tests for all new agent functionality using Vitest
• Include integration tests for critical user flows involving multiple contexts
• Mock external services in tests using MSW or similar libraries
• Maintain test coverage above 80% for AI-related business logic