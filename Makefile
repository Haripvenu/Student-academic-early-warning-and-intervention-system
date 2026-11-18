.PHONY: help up down build migrate seed train score test-backend test-frontend test lint

help:
	@echo "Academic Risk Monitor — Command Reference"
	@echo "  make up            Start all services via Docker Compose"
	@echo "  make down          Stop Docker Compose services"
	@echo "  make build         Build Docker images"
	@echo "  make migrate       Apply database migrations"
	@echo "  make seed          Generate synthetic records and seed database"
	@echo "  make train         Run unsupervised ML training across checkpoints"
	@echo "  make score         Score active term enrollments at specified checkpoint"
	@echo "  make test          Run full test suite (backend & frontend)"
	@echo "  make test-backend  Run pytest test suite"
	@echo "  make test-frontend Run vitest unit tests"

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

migrate:
	cd backend && alembic upgrade head

seed:
	python scripts/generate_demo_data.py
	python -m backend.app.cli seed

train:
	python -m backend.app.cli train

score:
	python -m backend.app.cli score --term 2014J --checkpoint W4

test: test-backend test-frontend

test-backend:
	pytest backend/tests -v

test-frontend:
	cd frontend && npm test -- --run

lint:
	flake8 backend
	cd frontend && npm run lint
