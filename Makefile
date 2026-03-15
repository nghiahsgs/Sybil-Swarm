.PHONY: dev dev-backend dev-frontend test lint docker-up docker-down install

# Development
dev:
	@echo "Starting backend + frontend..."
	@make dev-backend & make dev-frontend

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

# Install dependencies
install:
	cd backend && pip install -e ".[dev]"
	cd frontend && npm install

# Testing
test:
	cd backend && pytest -v

test-cov:
	cd backend && pytest --cov=app --cov-report=html

# Linting
lint:
	cd backend && ruff check . && ruff format --check .
	cd frontend && npm run lint

lint-fix:
	cd backend && ruff check --fix . && ruff format .
	cd frontend && npm run lint --fix

# Docker
docker-up:
	docker compose -f docker/docker-compose.yml up --build

docker-down:
	docker compose -f docker/docker-compose.yml down
