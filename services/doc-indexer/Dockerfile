FROM python:3.10.5-slim

ENV NLTK_DATA=/tmp/nltk_cache
ENV OS_ENV=linux

WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends -y \
    build-essential
RUN pip install --no-cache-dir poetry==1.7.1

COPY packages/py-db packages/py-db
COPY packages/py-storage packages/py-storage
COPY services/doc-indexer/pyproject.toml services/doc-indexer/
COPY services/doc-indexer/poetry.lock services/doc-indexer/

WORKDIR /app/services/doc-indexer
RUN poetry config virtualenvs.create true && \
    poetry config virtualenvs.in-project true && \
    poetry install --no-root --no-dev --no-interaction

# There is a bug with ChromaDB and linux. It requires sqlite3 >= 3.35.0.
# To circumvent this, we install pysqlite3-binary and switch it in sysmodules.
# https://stackoverflow.com/questions/77004853/chromadb-langchain-with-sentencetransformerembeddingfunction-throwing-sqlite3
RUN poetry add pysqlite-binary
RUN poetry run python -m nltk.downloader punkt stopwords -d ${NLTK_DATA}

COPY services/doc-indexer .

CMD ["poetry", "run", "python", "src/main.py"]