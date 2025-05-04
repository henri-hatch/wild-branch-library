# Wild Branch Library Backend

This is the backend for the Wild Branch Library, a project that provides a RESTful API for managing library resources and accessing the database of books, authors, and genres. The backend is built using Python with the FastAPI framework and uses SQLAlchemy for database interactions.

Note: This project was originally forked from the wonderful [Tenacity-Dev](https://github.com/Tenacity-Dev/fastapi-sqlalchemy2-alembic-postgresql) who provided a template for FastAPI with SQLAlchemy, Alembic, and PostgreSQL.

## Installation
- Create a virtual environment and activate it:
  ```bash
  python -m venv venv
  source venv/bin/activate  # On Windows use `venv\Scripts\activate`
  ```

- Install the Python dependincies:
  ```bash
  pip install -r requirements.txt
  ```

- Copy the `env.local` file to `.env` and set the environment variables as needed:
  ```bash
  cp env.local .env
  ```

- Compose the database and backend services using Docker:
  ```bash
  docker-compose up -d --build
  ```

- Run the Alembic migrations to set up the database schema:
  ```bash
  docker-compose exec backend alembic upgrade head
  ```

The backend should now be running and accessible at `http://localhost:8000`. You can also access the interactive API documentation at `http://localhost:8000/docs`.
FastAPI should automatically run via the `uvicorn` server when you run the Docker container.

## Usage
Pair this backend with the Wild Branch Library frontend, which is available in the parent folder of this repository. This backend is best built and used on a Linux server and run continuously in the background.