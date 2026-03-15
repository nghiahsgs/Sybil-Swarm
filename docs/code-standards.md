# Sybil Swarm — Code Standards

## Naming Conventions

### Python (Backend)

| Item | Convention | Example |
|------|-----------|---------|
| Module | snake_case | `llm_client.py`, `persona_generator.py` |
| Class | PascalCase | `SimulationEngine`, `LLMClient` |
| Function | snake_case | `generate_personas()`, `run_simulation()` |
| Variable | snake_case | `total_agents`, `api_key` |
| Constant | UPPER_SNAKE_CASE | `MAX_RETRIES`, `TIER_MODELS` |
| Private method | _snake_case | `_get_api_key_for_model()` |
| Enum | PascalCase (class) + UPPER_SNAKE_CASE (members) | `class SimulationStatus(Enum): PENDING = "pending"` |

### TypeScript/React (Frontend)

| Item | Convention | Example |
|------|-----------|---------|
| Component | PascalCase | `SimulationForm.tsx`, `ResultsPanel.tsx` |
| Function | camelCase | `fetchSimulation()`, `updateProgress()` |
| Variable | camelCase | `simulationId`, `isLoading` |
| Constant | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_TIMEOUT_MS` |
| Type/Interface | PascalCase | `ISimulation`, `SimulationResponse` |
| CSS class | kebab-case | `simulation-form`, `result-panel` |

### Database & API

| Item | Convention | Example |
|------|-----------|---------|
| Table name | snake_case (plural in code, singular in models) | `simulation`, `persona`, `agent_response` |
| Column | snake_case | `product_input`, `willingness_to_pay`, `created_at` |
| Enum value | lowercase with underscore | `pending`, `generating_personas`, `bulk` |
| Route | kebab-case | `/api/simulations`, `/api/simulations/{id}/stream` |
| Query param | camelCase | `?simulationId=123`, `?includeDetails=true` |

## Project Structure

### Backend Layout

```
backend/app/
├── models/              # SQLModel table definitions
├── routes/              # FastAPI route handlers (REST + SSE)
├── schemas/             # Pydantic request/response schemas
├── services/            # Business logic layers
│   ├── llm_client.py         (external API integration)
│   ├── input_parser.py       (data preprocessing)
│   ├── persona_generator.py  (synthetic data)
│   ├── simulation_engine.py  (orchestration)
│   ├── aggregator.py         (post-processing)
│   └── prompts.py            (prompt management)
├── config.py            # Settings (pydantic)
├── database.py          # ORM setup
└── main.py              # FastAPI app instance
```

### Frontend Layout

```
frontend/src/
├── app/
│   ├── page.tsx         # Root page component
│   ├── layout.tsx       # RootLayout wrapper
│   └── globals.css      # Global styles
├── components/          # Reusable React components
├── hooks/               # Custom React hooks
├── utils/               # Helper functions
├── services/            # API client / external integrations
└── types/               # TypeScript type definitions
```

## Code Standards by Layer

### Models (SQLModel)

```python
# ✓ Good
class Simulation(SQLModel, table=True):
    """A single simulation run."""

    id: Optional[int] = Field(default=None, primary_key=True)
    product_input: str
    status: SimulationStatus = SimulationStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def is_pending(self) -> bool:
        return self.status == SimulationStatus.PENDING

# ✗ Bad
class simulation(SQLModel, table=True):  # lowercase classname
    id: int = Field(primary_key=True)
    created_at: datetime  # missing default factory
    status: str  # use enum instead
```

### Services (Business Logic)

```python
# ✓ Good
async def llm_call(
    messages: list[dict],
    tier: AgentTier = AgentTier.BULK,
    json_mode: bool = False,
) -> str:
    """Make single LLM call with retry."""
    model = TIER_MODELS[tier]
    kwargs = {"model": model, "messages": messages, ...}
    async with _semaphore:
        response = await acompletion(**kwargs)
        return response.choices[0].message.content

# ✗ Bad
async def llm_call(messages, tier=None, **kwargs):  # untyped params
    """Call LLM."""  # vague docstring
    response = await acompletion(model=tier or DEFAULT, ...)  # no error handling
    return response.choices[0].message.content if response else None
```

### Routes (FastAPI)

```python
# ✓ Good
@router.post("/simulations")
async def create_simulation(
    request: CreateSimulationRequest,
    session: Session = Depends(get_session),
) -> SimulationResponse:
    """Create & start a new simulation."""
    sim = Simulation(product_input=request.product_input)
    session.add(sim)
    session.commit()
    session.refresh(sim)
    # Start async task
    asyncio.create_task(run_simulation(sim.id, session))
    return SimulationResponse.from_orm(sim)

# ✗ Bad
@router.post("/simulations")
def create_sim(data):  # no type hints, untyped param
    sim = Simulation(product_input=data["product_input"])  # no validation
    db.add(sim)
    db.commit()
    return {"id": sim.id}  # no response schema
```

### Frontend Components

```typescript
// ✓ Good
'use client';

interface SimulationFormProps {
  onSubmit: (input: string) => Promise<void>;
  isLoading?: boolean;
}

export function SimulationForm({ onSubmit, isLoading = false }: SimulationFormProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button disabled={isLoading}>{isLoading ? 'Loading...' : 'Submit'}</button>
    </form>
  );
}

// ✗ Bad
export function SimulationForm({ onSubmit }) {  // no types, missing props
  let input = '';  // mutable, no state
  const handleSubmit = (e) => {
    onSubmit(input);  // no error handling
  };
  return <form onSubmit={handleSubmit}><input onChange={(e) => { input = e.target.value; }} /></form>;
}
```

## Error Handling

### Python

```python
# ✓ Good — Specific exceptions, context
try:
    response = await llm_call(messages, tier=AgentTier.BULK)
except asyncio.TimeoutError:
    logger.error(f"LLM timeout for simulation {sim_id}", exc_info=True)
    sim.status = SimulationStatus.FAILED
    sim.error_message = "LLM call timed out"
except Exception as e:
    logger.exception(f"Unexpected error in simulation {sim_id}")
    raise

# ✗ Bad — Generic exception, no logging
try:
    response = await llm_call(messages)
except:
    pass  # silently fail
```

### TypeScript

```typescript
// ✓ Good — Typed error, user message
async function fetchSimulation(id: string): Promise<Simulation> {
  try {
    const response = await fetch(`/api/simulations/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch simulation';
    console.error('Fetch error:', message);
    throw new Error(`Unable to load simulation: ${message}`);
  }
}

// ✗ Bad — Untyped, no context
async function fetchSimulation(id) {
  const response = await fetch(`/api/simulations/${id}`);
  return response.json();  // no error handling
}
```

## Testing Guidelines

### Unit Tests (Backend)

```python
# ✓ Good — Clear test name, arrange/act/assert
async def test_llm_call_retries_on_timeout():
    """llm_call should retry up to 3x on timeout."""
    # Arrange
    with patch("app.services.llm_client.acompletion", side_effect=asyncio.TimeoutError):
        # Act & Assert
        with pytest.raises(asyncio.TimeoutError):
            await llm_call([{"role": "user", "content": "test"}])

def test_persona_tier_distribution():
    """generate_personas_batch should distribute tiers correctly."""
    # Arrange
    batch_size = 1000
    # Act
    personas = generate_personas_batch("product info", count=batch_size)
    bulk = [p for p in personas if p.tier == AgentTier.BULK]
    expert = [p for p in personas if p.tier == AgentTier.EXPERT]
    # Assert
    assert len(bulk) == 900
    assert len(expert) == 90

# ✗ Bad — Vague test name, no arrange/act/assert
def test_llm():
    result = llm_call([{"role": "user", "content": "test"}])
    assert result is not None
```

### Integration Tests (Frontend)

```typescript
// ✓ Good — Test behavior, not implementation
async function testSimulationFlow() {
  // Arrange
  render(<SimulationForm onSubmit={jest.fn()} />);
  const input = screen.getByPlaceholderText('Enter product URL');
  const submit = screen.getByRole('button', { name: /submit/i });

  // Act
  fireEvent.change(input, { target: { value: 'https://example.com' } });
  fireEvent.click(submit);

  // Assert
  await waitFor(() => {
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
}

// ✗ Bad — Tests implementation detail
function testForm() {
  const form = render(<SimulationForm onSubmit={() => {}} />);
  expect(form.container.querySelector('input')).toHaveValue('');  // too specific
}
```

## Documentation Standards

### Function/Method Docstrings

```python
# ✓ Good — Clear purpose, params, return, example
def aggregate_responses(
    simulation_id: int,
    responses: list[AgentResponse],
) -> AggregatedMetrics:
    """Compute metrics from agent responses.

    Args:
        simulation_id: ID of simulation (for logging)
        responses: All AgentResponse records for simulation

    Returns:
        AggregatedMetrics with conversion_rate, avg_wtp, sentiment_dist, etc.

    Example:
        metrics = aggregate_responses(123, responses)
        print(f"Conversion: {metrics.conversion_rate}%")
    """
    ...

# ✗ Bad — Vague, missing info
def aggregate_responses(sim_id, responses):
    """Aggregate responses."""
    ...
```

### Type Hints & Docstrings (TypeScript)

```typescript
// ✓ Good — Typed, JSDoc comment
/**
 * Fetch a simulation by ID.
 * @param id - Simulation ID
 * @returns Promise resolving to Simulation object
 * @throws Error if simulation not found
 */
export async function getSimulation(id: string): Promise<Simulation> {
  ...
}

// ✗ Bad — No types, vague comment
// Gets the sim
function getSimulation(id) {
  ...
}
```

## Performance Standards

### Concurrency

- **Backend**: Use semaphore to limit concurrent LLM calls (max_concurrent_agents)
- **Frontend**: Debounce search inputs (300ms), limit SSE reconnects (exponential backoff)

### Timeouts

- LLM calls: 60s timeout
- HTTP requests: 10s timeout for input parsing
- SSE stream: client-side reconnect after 30s inactivity

### Resource Usage

- Keep payload < 1MB per API response
- Batch database inserts (1000+ records at a time)
- Stream large results via SSE, not single response

## Security Standards

### API Security

```python
# ✓ Good — CORS restricted, input validated
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Restrict in prod
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

@router.post("/simulations")
async def create_simulation(request: CreateSimulationRequest):
    # Input validation via Pydantic schema
    ...

# ✗ Bad — CORS open, no validation
app.add_middleware(CORSMiddleware, allow_origins=["*"])
@router.post("/simulations")
def create_simulation(data):  # No schema validation
    ...
```

### Secrets Management

- Store API keys in `.env` file (never commit)
- Use pydantic-settings with BaseSettings for env var loading
- Validate at startup: `settings.has_any_api_key()` must be True

### URL Parsing

- Validate input is URL or plain text
- Use allowlist for safe domains (if scraping multiple domains)
- Set timeout on requests to prevent hanging
- Handle network errors gracefully

## Git & Commit Standards

### Commit Messages

```
[type]: Brief description (< 50 chars)

Longer explanation (if needed). Reference issue #123.
```

**Types**: feat, fix, docs, test, refactor, perf, chore

```
✓ feat: Add multi-tier agent routing for simulations
✓ fix: Handle timeout in LLM retries
✓ docs: Update codebase-summary.md
✗ update stuff
✗ WIP
```

### Branch Naming

```
feature/add-export-csv
bugfix/fix-persona-tier-distribution
docs/update-api-docs
hotfix/handle-sse-reconnect
```

## Review Checklist

Before submitting PR:

- [ ] Code follows naming conventions (snake_case, PascalCase, etc.)
- [ ] Type hints present (Python: type annotations, TS: interfaces)
- [ ] Error handling complete (try/catch, logging)
- [ ] Tests added/updated (unit + integration)
- [ ] Docstrings clear and complete
- [ ] No hardcoded secrets (API keys, passwords)
- [ ] Performance: no N+1 queries, proper timeouts
- [ ] No commented-out code (delete if unused)
- [ ] Commit messages follow standard

---

Last updated: 2026-03-15
