FROM python:3.10.5-slim

WORKDIR /app
RUN apt-get update \
    && apt-get install --no-install-recommends -y \
    build-essential
RUN pip install poetry==1.7.1
ENV POETRY_CACHE_DIR=/tmp/poetry_cache

COPY pyproject.toml poetry.lock ./
RUN poetry install --no-root --no-dev --no-interaction

CMD ["python", "src/main.py"]